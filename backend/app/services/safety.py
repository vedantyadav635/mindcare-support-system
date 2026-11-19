"""Rule-based crisis detection. Simple and explainable on purpose.

How it works:
1. normalise(text): lowercase, drop apostrophes ("don't" -> "dont"), turn punctuation/emoji into
   spaces, squeeze repeated letters ("diiiie" -> "die", "jaana" -> "jana"), collapse spaces.
2. Each rule in app/data/crisis_lexicon.json is a regex. Repeated letters in the patterns are
   squeezed the same way, so rules can be written in normal spelling.
3. The first rule that matches makes the text "high" risk; we return that rule's id so a
   counsellor can see WHY it was flagged.

It errs on the side of caution: a false alarm costs a counsellor a minute; a missed crisis can
cost a life. It does not understand context (e.g. negation), so "I'm not suicidal" is flagged too.
"""
import json
import re
from pathlib import Path

LEXICON_FILE = Path(__file__).resolve().parent.parent / "data" / "crisis_lexicon.json"

# A letter followed by one or more copies of itself, e.g. "ii" or "lll"
_REPEATED_LETTER = re.compile(r"([a-z])\1+")
# Same, but not right after a backslash, so regex escapes like "\bb" (\b + b) are left alone
_REPEATED_LETTER_IN_PATTERN = re.compile(r"(?<!\\)([a-z])\1+")


def normalise(text: str) -> str:
    text = text.lower()
    text = re.sub(r"['’`]", "", text)  # "I'm" -> "im", "don't" -> "dont"
    # ponytail: only Latin letters survive; add Devanagari rules if students write in Hindi script
    text = re.sub(r"[^a-z0-9]+", " ", text)  # punctuation, emoji, other scripts -> space
    text = _REPEATED_LETTER.sub(r"\1", text)
    return " ".join(text.split())  # collapse spaces


def _load_rules() -> list[tuple[str, re.Pattern, str]]:
    rules = []
    seen_ids = set()
    for rule in json.loads(LEXICON_FILE.read_text(encoding="utf-8")):
        if rule["id"] in seen_ids:
            raise ValueError(f"Duplicate crisis rule id: {rule['id']}")
        seen_ids.add(rule["id"])
        pattern = _REPEATED_LETTER_IN_PATTERN.sub(r"\1", rule["pattern"])
        rules.append((rule["id"], re.compile(pattern), rule["description"]))  # a broken regex fails here, at startup
    return rules


# Loaded and compiled ONCE, when the app starts (this module is imported at startup)
RULES = _load_rules()
DESCRIPTIONS = {rule_id: description for rule_id, _, description in RULES}


def check(text: str) -> dict:
    """{"risk_level": "high", "matched_rule": "<rule id>"} or {"risk_level": "none", "matched_rule": None}.

    Never log `text`: it is private.
    """
    normalised = normalise(text)
    for rule_id, regex, _ in RULES:
        if regex.search(normalised):
            return {"risk_level": "high", "matched_rule": rule_id}
    return {"risk_level": "none", "matched_rule": None}


def describe_rule(rule_id: str) -> str:
    """Human-readable reason for counsellors (falls back to the id for non-lexicon rules)."""
    return DESCRIPTIONS.get(rule_id, rule_id)
