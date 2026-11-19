"""Sentiment and emotion detection with two pre-trained Hugging Face models (CPU).

The models are loaded ONCE when the app starts (see lifespan in main.py), because loading
takes several seconds. Each analyse() call then takes well under a second.

The labels describe the tone of a message. They are not a diagnosis of anything.
"""
from app.config import settings

SENTIMENT_MODEL = "cardiffnlp/twitter-roberta-base-sentiment-latest"  # negative / neutral / positive
EMOTION_MODEL = "j-hartmann/emotion-english-distilroberta-base"  # anger, disgust, fear, joy, neutral, sadness, surprise
MAX_TOKENS = 512  # both models accept at most 512 tokens; longer text is cut

# Filled by load_models(): {"sentiment": pipeline, "emotion": pipeline}
_pipelines: dict = {}

# Returned when NLP_ENABLED is false (tests), so no model is downloaded or run
NEUTRAL_RESULT = {"sentiment": "neutral", "sentiment_score": 1.0, "emotion": "neutral", "emotion_score": 1.0}


def load_models() -> None:
    if not settings.NLP_ENABLED:
        return
    # Imported here, not at the top, so tests (NLP_ENABLED=false) never import torch
    from transformers import pipeline

    # device=-1 means CPU. The first run downloads the models to the Hugging Face cache.
    _pipelines["sentiment"] = pipeline("text-classification", model=SENTIMENT_MODEL, device=-1)
    _pipelines["emotion"] = pipeline("text-classification", model=EMOTION_MODEL, device=-1)


def _top_label(name: str, text: str) -> tuple[str, float]:
    # truncation + max_length: cut text longer than the model's 512-token limit instead of crashing
    result = _pipelines[name](text, truncation=True, max_length=MAX_TOKENS)[0]
    return result["label"].lower(), round(float(result["score"]), 3)


def analyse(text: str) -> dict:
    """{"sentiment", "sentiment_score", "emotion", "emotion_score"}. Slow-ish: call it in a worker thread."""
    if not settings.NLP_ENABLED:
        return dict(NEUTRAL_RESULT)
    sentiment, sentiment_score = _top_label("sentiment", text)
    emotion, emotion_score = _top_label("emotion", text)
    return {
        "sentiment": sentiment,
        "sentiment_score": sentiment_score,
        "emotion": emotion,
        "emotion_score": emotion_score,
    }
