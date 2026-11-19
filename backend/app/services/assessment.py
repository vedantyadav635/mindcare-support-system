"""PHQ-9 (depression) and GAD-7 (anxiety) self-assessments.

These are screening questionnaires. They show how often someone has had certain feelings;
they do NOT diagnose anything. Every result includes DISCLAIMER.
"""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.models import AlertSource, Assessment, AssessmentType, CrisisAlert, User

STEM = "Over the last 2 weeks, how often have you been bothered by any of the following problems?"

OPTIONS = [
    {"value": 0, "label": "Not at all"},
    {"value": 1, "label": "Several days"},
    {"value": 2, "label": "More than half the days"},
    {"value": 3, "label": "Nearly every day"},
]

# Standard published wording of both questionnaires
QUESTIONS = {
    AssessmentType.PHQ9: [
        "Little interest or pleasure in doing things",
        "Feeling down, depressed, or hopeless",
        "Trouble falling or staying asleep, or sleeping too much",
        "Feeling tired or having little energy",
        "Poor appetite or overeating",
        "Feeling bad about yourself — or that you are a failure or have let yourself or your family down",
        "Trouble concentrating on things, such as reading the newspaper or watching television",
        "Moving or speaking so slowly that other people could have noticed? Or the opposite — "
        "being so fidgety or restless that you have been moving around a lot more than usual",
        "Thoughts that you would be better off dead or of hurting yourself in some way",
    ],
    AssessmentType.GAD7: [
        "Feeling nervous, anxious or on edge",
        "Not being able to stop or control worrying",
        "Worrying too much about different things",
        "Trouble relaxing",
        "Being so restless that it is hard to sit still",
        "Becoming easily annoyed or irritable",
        "Feeling afraid as if something awful might happen",
    ],
}

# (highest score in the band, band name), checked in order
BANDS = {
    AssessmentType.PHQ9: [(4, "minimal"), (9, "mild"), (14, "moderate"), (19, "moderately severe"), (27, "severe")],
    AssessmentType.GAD7: [(4, "minimal"), (9, "mild"), (14, "moderate"), (21, "severe")],
}

# Supportive, non-diagnostic message for each band
MESSAGES = {
    "minimal": "Your answers suggest few difficulties right now. Keep up the habits that help you feel well.",
    "mild": "Your answers suggest some difficulties. Self-help resources and regular check-ins may help.",
    "moderate": "Your answers suggest you are going through a hard time. Talking to a counsellor could really help.",
    "moderately severe": "Your answers suggest you are struggling quite a lot. We encourage you to book a session with a counsellor.",
    "severe": "Your answers suggest you are struggling a lot right now. Please reach out to a counsellor soon; you don't have to handle this alone.",
}

DISCLAIMER = (
    "This questionnaire is a screening aid for awareness only. It is not a diagnosis. "
    "Only a qualified professional can assess your mental health."
)

# PHQ-9 question 9 asks about thoughts of self-harm (index 8 in the list)
PHQ9_SELF_HARM_INDEX = 8


def severity_band(assessment_type: AssessmentType, total: int) -> str:
    return next(name for upper, name in BANDS[assessment_type] if total <= upper)


def suggest_counsellor(band: str) -> bool:
    """From 'moderate' upward we suggest booking a counsellor."""
    return band not in ("minimal", "mild")


def get_helpline_info() -> dict:
    # TODO(Step 7): move to services/safety.py so the chatbot and check-in crisis responses share it
    return {
        "message": "If you are thinking about harming yourself, please reach out now. You are not alone.",
        "tele_manas": "Tele-MANAS (free, 24x7): 14416 or 1-800-891-4416",
        "campus_counsellor": settings.CAMPUS_COUNSELLOR_CONTACT,
    }


def is_crisis(assessment_type: AssessmentType, answers: list[int]) -> bool:
    """Any answer above 0 on PHQ-9 question 9 is treated as a possible crisis, whatever the total score."""
    return assessment_type == AssessmentType.PHQ9 and answers[PHQ9_SELF_HARM_INDEX] > 0


def raise_crisis_alert(db: Session, student: User) -> None:
    """Create an open alert for counsellors (committed together with the assessment).

    TODO(Step 7): the safety module should call one shared function for all sources
    (chat, check-in, assessment) instead of each module creating CrisisAlert rows itself.
    """
    db.add(CrisisAlert(student_id=student.id, source=AlertSource.assessment, matched_rule="phq9_item9_self_harm"))


def get_questions(assessment_type: AssessmentType) -> dict:
    return {
        "type": assessment_type,
        "stem": STEM,
        "questions": [{"number": i + 1, "text": text} for i, text in enumerate(QUESTIONS[assessment_type])],
        "options": OPTIONS,
        "disclaimer": DISCLAIMER,
    }


def submit_assessment(db: Session, student: User, assessment_type: AssessmentType, answers: list[int]) -> dict:
    """Score, save and build the response. Answers are already validated by the schema."""
    total = sum(answers)
    band = severity_band(assessment_type, total)
    crisis = is_crisis(assessment_type, answers)

    assessment = Assessment(
        student_id=student.id,
        type=assessment_type,
        answers=answers,
        total_score=total,
        severity_band=band,
    )
    db.add(assessment)
    if crisis:
        raise_crisis_alert(db, student)
    db.commit()  # the assessment and its alert are saved together

    return {
        "id": assessment.id,
        "type": assessment_type,
        "total_score": total,
        "severity_band": band,
        "message": MESSAGES[band],
        "suggest_counsellor": suggest_counsellor(band) or crisis,
        "crisis": crisis,
        "helpline": get_helpline_info() if crisis else None,
        "disclaimer": DISCLAIMER,
    }


def get_history(db: Session, student: User) -> dict:
    results = db.scalars(
        select(Assessment)
        .where(Assessment.student_id == student.id)  # only the student's own results
        .order_by(Assessment.created_at.desc(), Assessment.id.desc())
    )
    return {"results": list(results), "disclaimer": DISCLAIMER}
