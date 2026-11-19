"""The crisis detector must catch every risky sentence. A false alarm is better than a miss.

Run `pytest tests/test_safety.py -s` to see the printed catch rate.
"""
import pytest

from app.services.safety import check, normalise

# MUST be flagged (English and Hinglish, direct and indirect)
RISKY = [
    "I want to kill myself",
    "i wanna die",
    "I'm thinking about suicide",
    "I feel suicidal tonight",
    "I don't want to live anymore",
    "There's no reason to live",
    "Everyone would be better off without me",
    "I'm such a burden to my family",
    "I have been cutting myself again",
    "I want to end my life",
    "I've been saving up sleeping pills",
    "I have a plan to end it",
    "This is my final goodbye",
    "Goodbye forever, I'm sorry",
    "I wish I was never born",
    "What's the point of living?",
    "I can't go on like this",
    "I'm going to jump off the bridge",
    "I want to hang myself",
    "Nobody would even notice if I died",
    "I deserve to die",
    "I'd rather be dead",
    "I took too many pills on purpose",
    "I'm going to overdose tonight",
    "I keep thinking about ending it all",
    "I won't be here tomorrow",
    "By the time you read this I'll be gone",
    "I want to disappear forever",
    "I just want to sleep and never wake up",
    "Self-harm is the only thing that helps",
    "I burned my arm on purpose",
    "Life is not worth living",
    "I'm gonna end it tonight",
    "I wanna diiiiie!!!",
    "I  WANT   TO   DIE.",
    # Hinglish
    "main mar jaana chahta hoon",
    "jeene ka mann nahi karta",
    "khudkushi kar lunga",
    "suicide kar lunga",
    "mujhe ab jeena nahi hai",
    "sab khatam kar dunga",
    "main sab pe bojh hoon",
    "mere bina sab khush rahenge",
    "khud ko khatam kar dunga",
    "phansi laga lunga",
    "neend ki goliyan kha lunga",
    "ab aur nahi jee sakta",
    "marne ka mann kar raha hai",
    "zindagi se thak gaya hoon",
    "alvida dosto, hamesha ke liye",
    "mujhe marr jaana chahiye",
]

# Must NOT be flagged: everyday stress, sadness and figures of speech
NOT_RISKY = [
    "I'm so stressed about exams",
    "I could kill for a pizza right now",
    "This assignment is killing me",
    "I'm dying to see the new movie",
    "I feel really sad today",
    "I failed my test and I feel terrible",
    "I feel so lonely in the hostel",
    "I can't sleep at night because of stress",
    "My roommate is so annoying",
    "I'm tired of studying all day",
    "I miss my family a lot",
    "I cried a little after the call",
    "I hate this subject so much",
    "We killed it at the hackathon!",
    "I hurt my leg playing football",
    "My phone died in the middle of the lecture",
    "I'm dead tired after the lab",
    "I cut my hair short yesterday",
    "Bye everyone, see you tomorrow",
    "I'm proud of myself for finishing the project",
    "I need to take care of myself better",
    "Life is hard right now but I'm managing",
    "I want to sleep for a whole day after exams",
    "I have to take my medicine at 9",
    "Nobody replied to my message",
    "I'm worried about my placement",
    # Hinglish
    "aaj bahut tension hai exams ki",
    "mera mood kharab hai yaar",
    "bore ho raha hu",
    "mummy ki yaad aa rahi hai",
    "padhai mein mann nahi lag raha",
    "neend nahi aa rahi",
    "yaar ye assignment meri jaan le lega",
    "papa mujhe maar denge agar marks kam aaye",
    "bhai ye gaana zeher hai",
]


@pytest.mark.parametrize("sentence", RISKY)
def test_risky_sentence_is_flagged(sentence):
    result = check(sentence)
    assert result["risk_level"] == "high", f"MISSED: {sentence!r} (normalised: {normalise(sentence)!r})"
    assert result["matched_rule"]


@pytest.mark.parametrize("sentence", NOT_RISKY)
def test_normal_sentence_is_not_flagged(sentence):
    result = check(sentence)
    assert result == {"risk_level": "none", "matched_rule": None}, f"False alarm on {sentence!r}: {result}"


def test_catch_rate_report():
    caught = sum(check(s)["risk_level"] == "high" for s in RISKY)
    false_alarms = sum(check(s)["risk_level"] == "high" for s in NOT_RISKY)
    print(f"\nCrisis catch rate: {caught}/{len(RISKY)} = {caught / len(RISKY):.0%}")
    print(f"False alarms:      {false_alarms}/{len(NOT_RISKY)} = {false_alarms / len(NOT_RISKY):.0%}")
    assert len(RISKY) >= 25 and len(NOT_RISKY) >= 25
    assert caught == len(RISKY)  # missing a risky sentence is never acceptable


def test_normalise():
    assert normalise("I'm   SO   sad!!!") == "im so sad"
    assert normalise("diiiie") == "die"
    assert normalise("jaana") == "jana"
