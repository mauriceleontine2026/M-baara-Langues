import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.routers.lessons import build_module
from app.models.lesson import Lesson
from app.models.vocabulary import VocabularyItem


def test_build_module_uses_theme_specific_content():
    lesson = Lesson(
        id=1,
        title="Leçon 4 - Les couleurs",
        language_code="francais",
        lesson_number=4,
        difficulty="beginner",
        content="Leçon 4 - Les couleurs",
        published=True,
    )
    vocab = [
        VocabularyItem(word="rouge", translation_fr="red", example_target="Le rouge est ma couleur préférée.", example_fr="The red is my favorite color."),
        VocabularyItem(word="bleu", translation_fr="blue", example_target="Le ciel est bleu.", example_fr="The sky is blue."),
    ]

    module = build_module(lesson, vocab)

    description = module["module"]["description"]
    assert "couleur" in description.lower() or "couleurs" in description.lower()
    assert any("couleur" in ex.get("question", "").lower() or "couleurs" in ex.get("question", "").lower() for ex in module["module"]["exercices"])
