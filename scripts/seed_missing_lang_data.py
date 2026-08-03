from pathlib import Path
import json
import sqlite3

root = Path(__file__).resolve().parents[1]
lang_dir = root / 'src' / 'data' / 'dictionnaires'
lang_dir.mkdir(parents=True, exist_ok=True)

def write_lang(folder_name: str, code: str, entries):
    folder = lang_dir / folder_name
    folder.mkdir(parents=True, exist_ok=True)
    payload = [{
        'lecon': 1,
        'titre': f'Leçon 1 - {folder_name}',
        'description': f'Premiers mots de base en {folder_name}.',
        'vocabulaire': entries,
    }]
    target = folder / 'lecon_1_20.json'
    target.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')
    return target

language_data = {
    'Bissa': ('bissa', [
        {'langue_cible': 'Sanu', 'francais': 'Bonjour', 'exemple_langue_cible': 'Sanu, a nyi!', 'exemple_francais': 'Bonjour, ami !', 'phonetique': 'sa-nu', 'categorie': 'salutations'},
        {'langue_cible': 'Ayi', 'francais': 'Oui', 'exemple_langue_cible': 'Ayi, ma laa.', 'exemple_francais': 'Oui, je vais.', 'phonetique': 'a-yi', 'categorie': 'réponses'},
        {'langue_cible': 'Taa', 'francais': 'Merci', 'exemple_langue_cible': 'Taa jɛ.', 'exemple_francais': 'Merci beaucoup.', 'phonetique': 'taa', 'categorie': 'politesse'},
    ]),
    'Dioula': ('dioula', [
        {'langue_cible': 'Beni', 'francais': 'Bonjour', 'exemple_langue_cible': 'Beni, yé!', 'exemple_francais': 'Bonjour, toi !', 'phonetique': 'be-ni', 'categorie': 'salutations'},
        {'langue_cible': 'Ayi', 'francais': 'Oui', 'exemple_langue_cible': 'Ayi, men na.', 'exemple_francais': 'Oui, j’arrive.', 'phonetique': 'a-yi', 'categorie': 'réponses'},
        {'langue_cible': 'Mɛ', 'francais': 'Merci', 'exemple_langue_cible': 'Mɛ, ni.', 'exemple_francais': 'Merci, ami.', 'phonetique': 'me', 'categorie': 'politesse'},
    ]),
    'Fulfulde': ('fulfulde', [
        {'langue_cible': 'Salaam', 'francais': 'Bonjour', 'exemple_langue_cible': 'Salaam, jaa!', 'exemple_francais': 'Bonjour, bonjour !', 'phonetique': 'sa-laam', 'categorie': 'salutations'},
        {'langue_cible': 'Awa', 'francais': 'Oui', 'exemple_langue_cible': 'Awa, mi yaha.', 'exemple_francais': 'Oui, je pars.', 'phonetique': 'a-wa', 'categorie': 'réponses'},
        {'langue_cible': 'Joo', 'francais': 'Merci', 'exemple_langue_cible': 'Joo, baaba.', 'exemple_francais': 'Merci, père.', 'phonetique': 'joo', 'categorie': 'politesse'},
    ]),
    'Hindi': ('hindi', [
        {'langue_cible': 'नमस्ते', 'francais': 'Bonjour', 'exemple_langue_cible': 'नमस्ते, दोस्त!', 'exemple_francais': 'Bonjour, ami !', 'phonetique': 'na-mas-te', 'categorie': 'salutations'},
        {'langue_cible': 'हाँ', 'francais': 'Oui', 'exemple_langue_cible': 'हाँ, मैं आ रहा हूँ।', 'exemple_francais': 'Oui, j’arrive.', 'phonetique': 'haan', 'categorie': 'réponses'},
        {'langue_cible': 'धन्यवाद', 'francais': 'Merci', 'exemple_langue_cible': 'धन्यवाद, भाई!', 'exemple_francais': 'Merci, mon frère !', 'phonetique': 'dhan-ya-vaa-d', 'categorie': 'politesse'},
    ]),
    'Igbo': ('igbo', [
        {'langue_cible': 'Ndeewo', 'francais': 'Bonjour', 'exemple_langue_cible': 'Ndeewo, nwa m!', 'exemple_francais': 'Bonjour, mon enfant !', 'phonetique': 'n-deh-wo', 'categorie': 'salutations'},
        {'langue_cible': 'Ee', 'francais': 'Oui', 'exemple_langue_cible': 'Ee, m ga bia.', 'exemple_francais': 'Oui, je viendrai.', 'phonetique': 'eh', 'categorie': 'réponses'},
        {'langue_cible': 'Daalụ', 'francais': 'Merci', 'exemple_langue_cible': 'Daalụ, nwanne m.', 'exemple_francais': 'Merci, mon frère.', 'phonetique': 'daa-loo', 'categorie': 'politesse'},
    ]),
    'Kissi': ('kissi', [
        {'langue_cible': 'Aaye', 'francais': 'Bonjour', 'exemple_langue_cible': 'Aaye, mɛ!', 'exemple_francais': 'Bonjour, toi !', 'phonetique': 'a-ye', 'categorie': 'salutations'},
        {'langue_cible': 'Iya', 'francais': 'Oui', 'exemple_langue_cible': 'Iya, a ka.', 'exemple_francais': 'Oui, c’est bien.', 'phonetique': 'i-ya', 'categorie': 'réponses'},
        {'langue_cible': 'Baa', 'francais': 'Merci', 'exemple_langue_cible': 'Baa, nɛmɛ.', 'exemple_francais': 'Merci, ami.', 'phonetique': 'baa', 'categorie': 'politesse'},
    ]),
    'Kônôn': ('kono', [
        {'langue_cible': 'Bɛ', 'francais': 'Bonjour', 'exemple_langue_cible': 'Bɛ, sa!', 'exemple_francais': 'Bonjour, toi !', 'phonetique': 'be', 'categorie': 'salutations'},
        {'langue_cible': 'Aye', 'francais': 'Oui', 'exemple_langue_cible': 'Aye, ma zɛ.', 'exemple_francais': 'Oui, je viens.', 'phonetique': 'a-ye', 'categorie': 'réponses'},
        {'langue_cible': 'Sɛ', 'francais': 'Merci', 'exemple_langue_cible': 'Sɛ, nɛ.', 'exemple_francais': 'Merci, ami.', 'phonetique': 'se', 'categorie': 'politesse'},
    ]),
    'Lingala': ('lingala', [
        {'langue_cible': 'Mbote', 'francais': 'Bonjour', 'exemple_langue_cible': 'Mbote, molangi!', 'exemple_francais': 'Bonjour, ami !', 'phonetique': 'm-bo-te', 'categorie': 'salutations'},
        {'langue_cible': 'Iyo', 'francais': 'Oui', 'exemple_langue_cible': 'Iyo, nakozala.', 'exemple_francais': 'Oui, je vais bien.', 'phonetique': 'i-yo', 'categorie': 'réponses'},
        {'langue_cible': 'Matondi', 'francais': 'Merci', 'exemple_langue_cible': 'Matondi, mona.', 'exemple_francais': 'Merci, frère.', 'phonetique': 'ma-ton-di', 'categorie': 'politesse'},
    ]),
    'Mooré': ('moore', [
        {'langue_cible': 'Yɛlɛ', 'francais': 'Bonjour', 'exemple_langue_cible': 'Yɛlɛ, yã!', 'exemple_francais': 'Bonjour, toi !', 'phonetique': 'ye-le', 'categorie': 'salutations'},
        {'langue_cible': 'Ee', 'francais': 'Oui', 'exemple_langue_cible': 'Ee, ma na.', 'exemple_francais': 'Oui, j’arrive.', 'phonetique': 'ee', 'categorie': 'réponses'},
        {'langue_cible': 'Mɛh', 'francais': 'Merci', 'exemple_langue_cible': 'Mɛh, naba.', 'exemple_francais': 'Merci, monsieur.', 'phonetique': 'meh', 'categorie': 'politesse'},
    ]),
    'Nouchi': ('nouchi', [
        {'langue_cible': 'Salut', 'francais': 'Bonjour', 'exemple_langue_cible': 'Salut, mec!', 'exemple_francais': 'Bonjour, mon ami !', 'phonetique': 'sa-lut', 'categorie': 'salutations'},
        {'langue_cible': 'Oui', 'francais': 'Oui', 'exemple_langue_cible': 'Oui, je viens.', 'exemple_francais': 'Oui, je viens.', 'phonetique': 'wi', 'categorie': 'réponses'},
        {'langue_cible': 'Merci', 'francais': 'Merci', 'exemple_langue_cible': 'Merci, boss.', 'exemple_francais': 'Merci, chef.', 'phonetique': 'mer-si', 'categorie': 'politesse'},
    ]),
    'Swahili': ('swahili', [
        {'langue_cible': 'Hujambo', 'francais': 'Bonjour', 'exemple_langue_cible': 'Hujambo, rafiki!', 'exemple_francais': 'Bonjour, ami !', 'phonetique': 'hoo-jam-bo', 'categorie': 'salutations'},
        {'langue_cible': 'Ndiyo', 'francais': 'Oui', 'exemple_langue_cible': 'Ndiyo, nitaenda.', 'exemple_francais': 'Oui, je vais venir.', 'phonetique': 'n-di-yo', 'categorie': 'réponses'},
        {'langue_cible': 'Asante', 'francais': 'Merci', 'exemple_langue_cible': 'Asante sana.', 'exemple_francais': 'Merci beaucoup.', 'phonetique': 'a-san-te', 'categorie': 'politesse'},
    ]),
    'Toma': ('toma', [
        {'langue_cible': 'Nyi', 'francais': 'Bonjour', 'exemple_langue_cible': 'Nyi, mɛ!', 'exemple_francais': 'Bonjour, toi !', 'phonetique': 'nyi', 'categorie': 'salutations'},
        {'langue_cible': 'E', 'francais': 'Oui', 'exemple_langue_cible': 'E, ma ga.', 'exemple_francais': 'Oui, je vais.', 'phonetique': 'e', 'categorie': 'réponses'},
        {'langue_cible': 'Bɛ', 'francais': 'Merci', 'exemple_langue_cible': 'Bɛ, nɛ.', 'exemple_francais': 'Merci, ami.', 'phonetique': 'be', 'categorie': 'politesse'},
    ]),
    'Wolof': ('wolof', [
        {'langue_cible': 'Salaam', 'francais': 'Bonjour', 'exemple_langue_cible': 'Salaam, nàkk!', 'exemple_francais': 'Bonjour, ami !', 'phonetique': 'sa-laam', 'categorie': 'salutations'},
        {'langue_cible': 'Waaw', 'francais': 'Oui', 'exemple_langue_cible': 'Waaw, daan.', 'exemple_francais': 'Oui, c’est bon.', 'phonetique': 'waaw', 'categorie': 'réponses'},
        {'langue_cible': 'Jërëjëf', 'francais': 'Merci', 'exemple_langue_cible': 'Jërëjëf, baay.', 'exemple_francais': 'Merci, père.', 'phonetique': 'je-re-jef', 'categorie': 'politesse'},
    ]),
    'Yoruba': ('yoruba', [
        {'langue_cible': 'Bàbá', 'francais': 'Bonjour', 'exemple_langue_cible': 'Bàbá, èkó!', 'exemple_francais': 'Bonjour, ami !', 'phonetique': 'ba-ba', 'categorie': 'salutations'},
        {'langue_cible': 'Bẹ́ẹ́', 'francais': 'Oui', 'exemple_langue_cible': 'Bẹ́ẹ́, mo wa.', 'exemple_francais': 'Oui, je viens.', 'phonetique': 'be-e', 'categorie': 'réponses'},
        {'langue_cible': 'O ṣe', 'francais': 'Merci', 'exemple_langue_cible': 'O ṣe, ọrẹ mi.', 'exemple_francais': 'Merci, mon ami.', 'phonetique': 'o-shay', 'categorie': 'politesse'},
    ]),
}

for folder_name, (code, entries) in language_data.items():
    write_lang(folder_name, code, entries)

conn = sqlite3.connect(root / 'backend' / 'mbaara.db')
cur = conn.cursor()
for folder_name, (code, entries) in language_data.items():
    cur.execute("SELECT 1 FROM languages WHERE code = ?", (code,))
    if cur.fetchone() is None:
        cur.execute(
            "INSERT INTO languages (code, name, name_fr, region, family, status, color, flag_emoji, total_lessons, description) VALUES (?, ?, ?, ?, ?, 'active', '#000000', '🌍', 1, ?)",
            (code, folder_name, folder_name, 'Afrique', 'Langue locale', f'Langue {folder_name}')
        )
    else:
        cur.execute("UPDATE languages SET status='active', total_lessons = COALESCE(total_lessons, 0) + 1 WHERE code = ?", (code,))

    cur.execute("SELECT id FROM lessons WHERE language_code = ? AND lesson_number = 1", (code,))
    if cur.fetchone() is None:
        cur.execute(
            "INSERT INTO lessons (title, language_code, lesson_number, difficulty, content, published) VALUES (?, ?, 1, 'beginner', ?, 1)",
            (f'Leçon 1 - {folder_name}', code, f'Premiers mots de base en {folder_name}.')
        )

    for item in entries:
        word = item.get('langue_cible')
        if not word:
            continue
        cur.execute("SELECT id FROM vocabulary_items WHERE language_code = ? AND lesson_number = 1 AND word = ?", (code, word))
        if cur.fetchone() is None:
            cur.execute(
                "INSERT INTO vocabulary_items (language_code, lesson_number, word, translation_fr, phonetic, example_target, example_fr, difficulty) VALUES (?, 1, ?, ?, ?, ?, ?, 'beginner')",
                (code, word, item.get('francais'), item.get('phonetique'), item.get('exemple_langue_cible'), item.get('exemple_francais'))
            )

conn.commit()
conn.close()
print('OK')
