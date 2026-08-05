from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.lesson import Lesson
from ..models.vocabulary import VocabularyItem
from ..services.security import get_current_user
from random import sample

router = APIRouter()

LANGUAGE_LABELS = {
    "francais": "Français",
    "anglais": "Anglais",
    "espagnol": "Espagnol",
    "allemand": "Allemand",
    "italien": "Italien",
    "portugais": "Portugais",
    "russe": "Russe",
    "arabe": "Arabe",
    "hindi": "Hindi",
    "chinois": "Chinois",
    "japonais": "Japonais",
    "wolof": "Wolof",
    "dioula": "Dioula",
    "lingala": "Lingala",
    "swahili": "Swahili",
    "bissa": "Bissa",
    "kissi": "Kissi",
    "kono": "Kono",
    "toma": "Toma",
    "moore": "Mooré",
    "pular": "Pular",
    "soussou": "Soussou",
    "malinke": "Malinké",
    "guerze": "Guerzé",
    "yoruba": "Yoruba",
    "igbo": "Igbo",
    "nouchi": "Nouchi",
}

QUESTION_INTERFACE = "Français"


def difficulty_to_niveau(level: str | None, difficulty: str | None) -> str:
    if level:
        return {
            "A1": "Débutant A1",
            "A2": "Débutant A2",
            "B1": "Intermédiaire B1",
            "B2": "Intermédiaire B2",
        }.get(level, f"Niveau {level}")
    if difficulty == "beginner":
        return "Débutant A1"
    if difficulty == "intermediate":
        return "Intermédiaire A2"
    if difficulty == "advanced":
        return "Avancé B2"
    return "Débutant A1"


def get_language_label(language_code: str) -> str:
    return LANGUAGE_LABELS.get(language_code, language_code.title())


def get_theme_context(lesson: Lesson) -> dict | None:
    title_text = f"{lesson.title or ''} {lesson.content or ''} {lesson.description or ''}".lower()
    if "couleur" in title_text or "couleurs" in title_text:
        return {
            "focus": "couleurs",
            "description": "Apprenez à nommer les couleurs, à les associer à des objets du quotidien et à construire de courtes phrases utiles.",
            "sample_sentence": "Le rouge est ma couleur préférée.",
            "exercise_prompt": "Complète la phrase liée aux couleurs",
        }
    if "famille" in title_text:
        return {
            "focus": "famille",
            "description": "Pratiquez les mots de la famille, les liens de parenté et les phrases simples pour se présenter auprès des proches.",
            "sample_sentence": "Ma sœur aime chanter.",
            "exercise_prompt": "Complète la phrase liée à la famille",
        }
    if "nombre" in title_text or "compter" in title_text or "prix" in title_text:
        return {
            "focus": "nombres",
            "description": "Apprenez à compter, à dire des prix et à utiliser des quantités simples dans des situations concrètes.",
            "sample_sentence": "Le prix est de trois euros.",
            "exercise_prompt": "Complète la phrase liée aux nombres",
        }
    if "salut" in title_text or "bonjour" in title_text or "au revoir" in title_text or "merci" in title_text:
        return {
            "focus": "salutations",
            "description": "Pratiquez les formules de politesse, les salutations de base et les échanges simples au quotidien.",
            "sample_sentence": "Bonjour, comment ça va ?",
            "exercise_prompt": "Complète la phrase liée aux salutations",
        }
    if "temps" in title_text or "météo" in title_text or "saison" in title_text:
        return {
            "focus": "temps",
            "description": "Apprenez à parler du temps qu'il fait, des saisons et des activités liées à la météo.",
            "sample_sentence": "Aujourd'hui il fait beau.",
            "exercise_prompt": "Complète la phrase liée au temps",
        }
    if "direction" in title_text or "ville" in title_text or "marché" in title_text:
        return {
            "focus": "directions",
            "description": "Maîtrisez les expressions utiles pour demander et donner des directions dans la ville ou au marché.",
            "sample_sentence": "Tournez à gauche au carrefour.",
            "exercise_prompt": "Complète la phrase liée aux directions",
        }
    if "aliment" in title_text or "nourriture" in title_text or "manger" in title_text or "restaurant" in title_text:
        return {
            "focus": "aliments",
            "description": "Apprenez à nommer les aliments de base, à exprimer vos goûts et à commander dans un restaurant.",
            "sample_sentence": "Je voudrais du pain et du lait.",
            "exercise_prompt": "Complète la phrase liée aux aliments",
        }
    if "maison" in title_text or "pièce" in title_text or "objet" in title_text:
        return {
            "focus": "maison",
            "description": "Parlez des pièces, des objets et des activités quotidiennes à la maison.",
            "sample_sentence": "La cuisine est à gauche.",
            "exercise_prompt": "Complète la phrase liée à la maison",
        }
    if "animal" in title_text:
        return {
            "focus": "animaux",
            "description": "Découvrez les noms des animaux, leurs habitudes et les expressions utiles pour les identifier.",
            "sample_sentence": "Le chien aboie fort.",
            "exercise_prompt": "Complète la phrase liée aux animaux",
        }
    if "émotion" in title_text or "sentiment" in title_text:
        return {
            "focus": "émotions",
            "description": "Exprimez vos émotions de base et utilisez des formules simples pour parler de ce que vous ressentez.",
            "sample_sentence": "Je suis heureux aujourd'hui.",
            "exercise_prompt": "Complète la phrase liée aux émotions",
        }
    if "santé" in title_text or "malade" in title_text or "symptôme" in title_text:
        return {
            "focus": "santé",
            "description": "Apprenez à parler de votre santé, à décrire les symptômes et à demander de l'aide.",
            "sample_sentence": "J'ai mal à la tête.",
            "exercise_prompt": "Complète la phrase liée à la santé",
        }
    if "vêtement" in title_text or "vêtements" in title_text or "robe" in title_text or "chaussure" in title_text:
        return {
            "focus": "vêtements",
            "description": "Apprenez à nommer les vêtements, les couleurs et à décrire ce que vous portez.",
            "sample_sentence": "Je porte une robe bleue.",
            "exercise_prompt": "Complète la phrase liée aux vêtements",
        }
    if "transport" in title_text or "train" in title_text or "bus" in title_text or "voiture" in title_text:
        return {
            "focus": "transports",
            "description": "Pratiquez les moyens de transport, les trajets et les expressions utiles pour voyager.",
            "sample_sentence": "Je prends le bus tous les matins.",
            "exercise_prompt": "Complète la phrase liée aux transports",
        }
    if "loisir" in title_text or "sport" in title_text or "jeu" in title_text:
        return {
            "focus": "loisirs",
            "description": "Parlez de vos hobbies, de vos activités préférées et des habitudes du quotidien.",
            "sample_sentence": "J'aime jouer au football.",
            "exercise_prompt": "Complète la phrase liée aux loisirs",
        }
    if "voyage" in title_text or "culture" in title_text:
        return {
            "focus": "voyage",
            "description": "Utilisez des phrases utiles pour voyager, demander des informations et découvrir une culture nouvelle.",
            "sample_sentence": "Où se trouve la gare ?",
            "exercise_prompt": "Complète la phrase liée au voyage",
        }
    if "tradition" in title_text or "coutume" in title_text or "fête" in title_text:
        return {
            "focus": "traditions",
            "description": "Découvrez les coutumes, les fêtes et les expressions associées aux traditions locales.",
            "sample_sentence": "Nous célébrons cette fête ensemble.",
            "exercise_prompt": "Complète la phrase liée aux traditions",
        }
    return None


def build_exercises(lesson: Lesson, vocab_items: list[VocabularyItem]) -> list[dict]:
    exercises = []
    items = [item for item in vocab_items if item.word and item.translation_fr]
    theme_context = get_theme_context(lesson)
    if not items:
        lesson_label = lesson.title or f"Leçon {lesson.lesson_number}"
        fallback_text = theme_context["description"] if theme_context else lesson.content or lesson.description or f"Exercez-vous avec cette leçon de {get_language_label(lesson.language_code)}."
        return [
            {
                "id": 1,
                "type": "reading",
                "instruction": "Lis attentivement le texte ci-dessous.",
                "question": fallback_text,
                "options": [],
                "answer": fallback_text,
                "explanation_on_error": "Lis le texte une seconde fois et concentre-toi sur le sens.",
                "xp_reward": 5,
            },
            {
                "id": 2,
                "type": "multiple_choice",
                "instruction": "Choisis l'énoncé qui décrit le mieux cette leçon.",
                "question": f"Quel est le thème principal de cette leçon ? {lesson_label}",
                "options": [
                    lesson_label,
                    f"Vocabulaire de base en {get_language_label(lesson.language_code)}",
                    "Exercice de grammaire",
                ],
                "answer": lesson_label,
                "explanation_on_error": "Le titre de la leçon est l'option la plus pertinente.",
                "xp_reward": 5,
            },
        ]

    primary = items[0]
    sample_items = items if len(items) <= 4 else sample(items, 4)
    if primary.example_target:
        phrase = primary.example_target
    else:
        phrase = f"{primary.word}"

    focus_label = theme_context["focus"] if theme_context else "thème"
    focus_phrase = theme_context["exercise_prompt"] if theme_context else "phrase"

    # Word bank
    exercises.append({
        "id": 1,
        "type": "word_bank",
        "instruction": f"Remets les mots dans le bon ordre pour parler des {focus_label}.",
        "question": f"Traduis en {get_language_label(lesson.language_code)} : {primary.translation_fr}.",
        "options": [word for word in primary.word.split(" ")],
        "answer": primary.word,
        "explanation_on_error": "C’est la traduction directe du français.",
        "xp_reward": 10,
    })

    # Fill in the blank
    blank_word = primary.word
    blank_text = phrase.replace(blank_word, "____") if blank_word in phrase else f"{phrase} ____"
    exercises.append({
        "id": 2,
        "type": "fill_in_blank",
        "instruction": "Complète la phrase avec le bon mot.",
        "question": f"{focus_phrase}: {blank_text}",
        "options": [blank_word] + [item.word for item in sample(items[1:5], min(2, len(items) - 1))] if len(items) > 1 else [blank_word],
        "answer": blank_word,
        "explanation_on_error": "Le mot correspond à la phrase donnée.",
        "xp_reward": 10,
    })

    # Pair matching
    pairs = []
    for item in sample_items:
        pairs.append({"pair": [item.word, item.translation_fr]})
    exercises.append({
        "id": 3,
        "type": "pair_matching",
        "instruction": f"Associe chaque mot à sa traduction liée aux {focus_label}.",
        "question": None,
        "options": [f"{item.word} - {item.translation_fr}" for item in sample_items],
        "answer": pairs,
        "explanation_on_error": "Lis chaque mot et sa traduction ensemble.",
        "xp_reward": 10,
    })

    # Interactive story
    story_item = sample_items[0]
    exercises.append({
        "id": 4,
        "type": "interactive_story",
        "instruction": "Choisis la meilleure réponse dans le mini-dialogue.",
        "question": f"Client: 'Je voudrais {story_item.word}.' Vendeur: '____ ?' ({focus_label})",
        "options": ["Combien ça coûte", "Qui êtes-vous", "Où est le marché"],
        "answer": "Combien ça coûte",
        "explanation_on_error": "Le vendeur demande le prix.",
        "xp_reward": 10,
    })

    # Audio listen
    exercises.append({
        "id": 5,
        "type": "audio_listen",
        "instruction": "Écoute et écris la phrase entendue.",
        "question": f"Audio: {theme_context['sample_sentence'] if theme_context else phrase}",
        "options": [],
        "answer": theme_context['sample_sentence'] if theme_context else phrase,
        "explanation_on_error": "Écoute bien la phrase entière.",
        "xp_reward": 10,
    })

    return exercises


def build_module(lesson: Lesson, vocab_items: list[VocabularyItem]) -> dict:
    theme_context = get_theme_context(lesson)
    structured = {
        "theme": lesson.title or f"Leçon {lesson.lesson_number}",
        "niveau": difficulty_to_niveau(getattr(lesson, "level", None), lesson.difficulty),
        "langue_apprise": get_language_label(lesson.language_code),
        "langue_interface": QUESTION_INTERFACE,
        "description": theme_context["description"] if theme_context else lesson.content or lesson.description or f"Exercez-vous avec la leçon {lesson.title}.",
        "exercices": build_exercises(lesson, vocab_items),
    }
    return {
        "id": lesson.id,
        "title": lesson.title,
        "language_code": lesson.language_code,
        "lesson_number": lesson.lesson_number,
        "difficulty": lesson.difficulty,
        "content": lesson.content,
        "published": lesson.published,
        "description": getattr(lesson, "description", None),
        "title_fr": getattr(lesson, "title_fr", None),
        "level": getattr(lesson, "level", None),
        "type": getattr(lesson, "type", None),
        "order": getattr(lesson, "order", None),
        "module": structured,
    }


class LessonCreateRequest(BaseModel):
    title: str
    language_code: str
    lesson_number: int | None = None
    difficulty: str | None = None
    content: str | None = None
    published: bool | None = None
    description: str | None = None
    title_fr: str | None = None
    level: str | None = None
    type: str | None = None
    order: int | None = None


class LessonUpdateRequest(BaseModel):
    title: str | None = None
    language_code: str | None = None
    lesson_number: int | None = None
    difficulty: str | None = None
    content: str | None = None
    published: bool | None = None
    description: str | None = None
    title_fr: str | None = None
    level: str | None = None
    type: str | None = None
    order: int | None = None


@router.get("")
def list_lessons(language_code: str | None = None, lesson_number: int | None = None, db: Session = Depends(get_db)):
    query = db.query(Lesson).filter(Lesson.published.is_(True))
    if language_code:
        query = query.filter(Lesson.language_code == language_code)
    if lesson_number is not None:
        query = query.filter(Lesson.lesson_number == lesson_number)
    lessons = query.order_by(Lesson.lesson_number.asc()).all()
    if not lessons and not language_code:
        db.add_all([
            Lesson(title="Saluer", language_code="fr", lesson_number=1, difficulty="beginner", content="Commencez par saluer en français."),
            Lesson(title="Se présenter", language_code="fr", lesson_number=2, difficulty="beginner", content="Apprenez à vous présenter."),
            Lesson(title="Parler du quotidien", language_code="fr", lesson_number=3, difficulty="intermediate", content="Pratiquez les situations courantes."),
        ])
        db.commit()
        lessons = db.query(Lesson).filter(Lesson.published.is_(True)).order_by(Lesson.lesson_number.asc()).all()
    modules = []
    for lesson in lessons:
        vocab_items = db.query(VocabularyItem).filter(VocabularyItem.language_code == lesson.language_code, VocabularyItem.lesson_number == lesson.lesson_number).order_by(VocabularyItem.id.asc()).all()
        modules.append(build_module(lesson, vocab_items))
    return modules


@router.post("", status_code=status.HTTP_201_CREATED)
def create_lesson(payload: LessonCreateRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin required")
    lesson = Lesson(
        title=payload.title,
        language_code=payload.language_code,
        lesson_number=payload.lesson_number or 1,
        difficulty=payload.difficulty or "beginner",
        content=payload.content,
        published=payload.published if payload.published is not None else True,
    )
    if payload.description is not None:
        lesson.description = payload.description
    if payload.title_fr is not None:
        lesson.title_fr = payload.title_fr
    if payload.level is not None:
        lesson.level = payload.level
    if payload.type is not None:
        lesson.type = payload.type
    if payload.order is not None:
        lesson.order = payload.order
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return {
        "id": lesson.id,
        "title": lesson.title,
        "language_code": lesson.language_code,
        "lesson_number": lesson.lesson_number,
        "difficulty": lesson.difficulty,
        "content": lesson.content,
        "published": lesson.published,
        "description": getattr(lesson, "description", None),
        "title_fr": getattr(lesson, "title_fr", None),
        "level": getattr(lesson, "level", None),
        "type": getattr(lesson, "type", None),
        "order": getattr(lesson, "order", None),
    }


@router.put("/{lesson_id}")
def update_lesson(lesson_id: int, payload: LessonUpdateRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin required")
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(lesson, field, value)
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return {
        "id": lesson.id,
        "title": lesson.title,
        "language_code": lesson.language_code,
        "lesson_number": lesson.lesson_number,
        "difficulty": lesson.difficulty,
        "content": lesson.content,
        "published": lesson.published,
        "description": getattr(lesson, "description", None),
        "title_fr": getattr(lesson, "title_fr", None),
        "level": getattr(lesson, "level", None),
        "type": getattr(lesson, "type", None),
        "order": getattr(lesson, "order", None),
    }
