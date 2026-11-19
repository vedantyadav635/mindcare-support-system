"""Recommends wellness resources from the student's recent data. Rule-based and explainable.

Signals (last 7 days), each scaled 0..1 (0 = no concern, 1 = strongest concern):
    low_mood      = (5 - avg mood) / 4               mood 5 -> 0, mood 1 -> 1
    stress        = (avg stress - 1) / 4             stress 1 -> 0, stress 5 -> 1
    sleep_deficit = max(0, 7 - avg sleep hours) / 7  7h+ -> 0, 0h -> 1
    emotion share = fraction of the student's chat messages with that emotion

Resource score = sum of WEIGHTS[signal] * signal, counting only the signals that match the
resource's tags (see SIGNAL_TAGS / EMOTION_TAGS). The biggest part becomes the "why" text.
"""
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import AlertStatus, Assessment, ChatMessage, ChatSender, CrisisAlert, Resource, ResourceType, WellbeingEntry
from app.services.assessment import suggest_counsellor

# Tune the recommender here. They add up to 1, so a score is always between 0 and 1.
WEIGHTS = {
    "low_mood": 0.35,
    "stress": 0.30,
    "sleep_deficit": 0.20,
    "emotion_match": 0.15,
}

# Which resource tags each wellbeing signal applies to
SIGNAL_TAGS = {
    "low_mood": {"low_mood", "sadness"},
    "stress": {"stress", "anxiety"},
    "sleep_deficit": {"sleep"},
}

# Chat emotion (from the emotion model) -> matching resource tag
EMOTION_TAGS = {"sadness": "sadness", "fear": "fear", "anger": "anger"}
EMOTION_WORDS = {"sadness": "sad", "fear": "anxious or scared", "anger": "angry"}

LOOKBACK_DAYS = 7
ASSESSMENT_LOOKBACK_DAYS = 14
HEALTHY_SLEEP_HOURS = 7

# Shown when there is no data yet: one resource for each of these tags, in this order
DEFAULT_TAGS = ["stress", "sleep", "low_mood", "anxiety", "loneliness", "academic"]
DEFAULT_WHY = "A good place to start"
COUNSELLING_WHY = "Talking to a counsellor could really help with what you're going through right now"


@dataclass
class Signals:
    low_mood: float = 0.0
    stress: float = 0.0
    sleep_deficit: float = 0.0
    emotion_share: dict[str, float] = field(default_factory=dict)
    # The raw averages, kept for the "why" text
    avg_mood: float | None = None
    avg_stress: float | None = None
    avg_sleep: float | None = None

    @property
    def has_data(self) -> bool:
        return any(v is not None for v in (self.avg_mood, self.avg_stress, self.avg_sleep)) or bool(self.emotion_share)


@dataclass
class Recommendation:
    resource: Resource
    score: float
    why: str


# ---------- Pure scoring (no database; unit-tested with hand-made numbers) ----------

def compute_signals(
    avg_mood: float | None, avg_stress: float | None, avg_sleep: float | None, emotion_counts: dict[str, int]
) -> Signals:
    total_messages = sum(emotion_counts.values())
    return Signals(
        low_mood=(5 - avg_mood) / 4 if avg_mood is not None else 0.0,
        stress=(avg_stress - 1) / 4 if avg_stress is not None else 0.0,
        sleep_deficit=max(0.0, HEALTHY_SLEEP_HOURS - avg_sleep) / HEALTHY_SLEEP_HOURS if avg_sleep is not None else 0.0,
        emotion_share={e: n / total_messages for e, n in emotion_counts.items()} if total_messages else {},
        avg_mood=avg_mood,
        avg_stress=avg_stress,
        avg_sleep=avg_sleep,
    )


def score_resource(tags: list[str], signals: Signals) -> tuple[float, str | None]:
    """Returns (score 0..1, why text). The why text explains the biggest part of the score."""
    tags = set(tags)
    parts: dict[str, float] = {}  # signal name -> its contribution to the score

    for signal, signal_tags in SIGNAL_TAGS.items():
        if tags & signal_tags:
            parts[signal] = WEIGHTS[signal] * getattr(signals, signal)  # e.g. 0.20 * signals.sleep_deficit

    # Emotion: use the student's most common emotion among those this resource is tagged for
    matching = [(signals.emotion_share.get(emotion, 0.0), emotion) for emotion, tag in EMOTION_TAGS.items() if tag in tags]
    best_share, best_emotion = max(matching, default=(0.0, None))
    if best_share > 0:
        parts["emotion_match"] = WEIGHTS["emotion_match"] * best_share

    score = sum(parts.values())
    if score <= 0:
        return 0.0, None
    biggest = max(parts, key=parts.get)
    return round(score, 3), _why(biggest, signals, best_emotion, best_share)


def _why(signal: str, signals: Signals, emotion: str | None, share: float) -> str:
    if signal == "low_mood":
        return f"Because your mood averaged {signals.avg_mood:.1f}/5 this week"
    if signal == "stress":
        return f"Because your stress averaged {signals.avg_stress:.1f}/5 this week"
    if signal == "sleep_deficit":
        return f"Because your sleep averaged {signals.avg_sleep:.1f} hours this week"
    return f"Because {share:.0%} of your recent chat messages sounded {EMOTION_WORDS[emotion]}"


def rank(resources: list[Resource], signals: Signals, needs_counsellor: bool, limit: int) -> list[Recommendation]:
    """Order resources by score; fill up with defaults; put counselling first if needed."""
    # The crisis helpline is shown by the safety layer, never as an everyday recommendation
    resources = [r for r in resources if "crisis" not in r.tags]

    scored = []
    for resource in resources:
        score, why = score_resource(resource.tags, signals)
        if score > 0:
            scored.append(Recommendation(resource, score, why))
    scored.sort(key=lambda rec: (-rec.score, rec.resource.id))
    result = scored[:limit]

    # Not enough (or no data yet): add a varied default selection with score 0
    chosen = {rec.resource.id for rec in result}
    for tag in DEFAULT_TAGS:
        if len(result) >= limit:
            break
        pick = next((r for r in resources if tag in r.tags and r.id not in chosen and r.type != ResourceType.counselling), None)
        if pick:
            result.append(Recommendation(pick, 0.0, DEFAULT_WHY))
            chosen.add(pick.id)

    if needs_counsellor:
        counselling = next((r for r in resources if r.type == ResourceType.counselling), None)
        if counselling:
            result = [rec for rec in result if rec.resource.id != counselling.id]
            score, _ = score_resource(counselling.tags, signals)
            result.insert(0, Recommendation(counselling, score, COUNSELLING_WHY))

    return result[:limit]


# ---------- Reading the student's data ----------

def _load_signals(db: Session, student_id: int) -> Signals:
    since_date = date.today() - timedelta(days=LOOKBACK_DAYS - 1)  # the last 7 days, including today
    since_time = datetime.now(timezone.utc) - timedelta(days=LOOKBACK_DAYS)

    # AVG skips NULLs, so a missing answer doesn't pull the average down
    avg_mood, avg_stress, avg_sleep = db.execute(
        select(func.avg(WellbeingEntry.mood), func.avg(WellbeingEntry.stress), func.avg(WellbeingEntry.sleep_hours))
        .where(WellbeingEntry.student_id == student_id, WellbeingEntry.entry_date >= since_date)
    ).one()

    emotion_counts = dict(
        db.execute(
            select(ChatMessage.emotion, func.count())
            .where(
                ChatMessage.student_id == student_id,
                ChatMessage.sender == ChatSender.student,
                ChatMessage.emotion.is_not(None),
                ChatMessage.created_at >= since_time,
            )
            .group_by(ChatMessage.emotion)
        ).all()
    )

    as_float = lambda value: float(value) if value is not None else None  # SQL AVG returns Decimal
    return compute_signals(as_float(avg_mood), as_float(avg_stress), as_float(avg_sleep), emotion_counts)


def _needs_counsellor(db: Session, student_id: int) -> bool:
    """Latest assessment in the last 14 days is moderate or worse, or there is an open crisis alert."""
    since = datetime.now(timezone.utc) - timedelta(days=ASSESSMENT_LOOKBACK_DAYS)
    latest_band = db.scalar(
        select(Assessment.severity_band)
        .where(Assessment.student_id == student_id, Assessment.created_at >= since)
        .order_by(Assessment.created_at.desc(), Assessment.id.desc())
        .limit(1)
    )
    if latest_band and suggest_counsellor(latest_band):
        return True
    open_alert = db.scalar(
        select(CrisisAlert.id).where(CrisisAlert.student_id == student_id, CrisisAlert.status == AlertStatus.open).limit(1)
    )
    return open_alert is not None


def recommend(db: Session, student_id: int, limit: int = 5) -> list[Recommendation]:
    # ponytail: scores every active resource in Python; fine for a few hundred resources
    resources = list(db.scalars(select(Resource).where(Resource.is_active).order_by(Resource.id)))
    return rank(resources, _load_signals(db, student_id), _needs_counsellor(db, student_id), limit)
