import urllib.request, json

BASE = 'https://mbaara-backend.vercel.app/api/vocabulary'
entries = [
    # Wolof
    {"language_code":"wolof","lesson_number":1,"word":"Salaam","translation_fr":"Bonjour","phonetic":"sa-laam","example_target":"Salaam, nàkk!","example_fr":"Bonjour, ami !","difficulty":"beginner"},
    {"language_code":"wolof","lesson_number":1,"word":"Waaw","translation_fr":"Oui","phonetic":"waaw","example_target":"Waaw, daan.","example_fr":"Oui, c’est bon.","difficulty":"beginner"},
    {"language_code":"wolof","lesson_number":1,"word":"Jërëjëf","translation_fr":"Merci","phonetic":"je-re-jef","example_target":"Jërëjëf, baay.","example_fr":"Merci, père.","difficulty":"beginner"},
    # Dioula
    {"language_code":"dioula","lesson_number":1,"word":"Beni","translation_fr":"Bonjour","phonetic":"be-ni","example_target":"Beni, yé!","example_fr":"Bonjour, toi !","difficulty":"beginner"},
    {"language_code":"dioula","lesson_number":1,"word":"Ayi","translation_fr":"Oui","phonetic":"a-yi","example_target":"Ayi, men na.","example_fr":"Oui, j’arrive.","difficulty":"beginner"},
    {"language_code":"dioula","lesson_number":1,"word":"Mɛ","translation_fr":"Merci","phonetic":"me","example_target":"Mɛ, ni.","example_fr":"Merci, ami.","difficulty":"beginner"},
    # Lingala
    {"language_code":"lingala","lesson_number":1,"word":"Mbote","translation_fr":"Bonjour","phonetic":"m-bo-te","example_target":"Mbote, molangi!","example_fr":"Bonjour, ami !","difficulty":"beginner"},
    {"language_code":"lingala","lesson_number":1,"word":"Iyo","translation_fr":"Oui","phonetic":"i-yo","example_target":"Iyo, nakozala.","example_fr":"Oui, je vais bien.","difficulty":"beginner"},
    {"language_code":"lingala","lesson_number":1,"word":"Matondi","translation_fr":"Merci","phonetic":"ma-ton-di","example_target":"Matondi, mona.","example_fr":"Merci, frère.","difficulty":"beginner"},
    # Swahili
    {"language_code":"swahili","lesson_number":1,"word":"Hujambo","translation_fr":"Bonjour","phonetic":"hoo-jam-bo","example_target":"Hujambo, rafiki!","example_fr":"Bonjour, ami !","difficulty":"beginner"},
    {"language_code":"swahili","lesson_number":1,"word":"Ndiyo","translation_fr":"Oui","phonetic":"n-di-yo","example_target":"Ndiyo, nitaenda.","example_fr":"Oui, je vais venir.","difficulty":"beginner"},
    {"language_code":"swahili","lesson_number":1,"word":"Asante","translation_fr":"Merci","phonetic":"a-san-te","example_target":"Asante sana.","example_fr":"Merci beaucoup.","difficulty":"beginner"}
]

for e in entries:
    data = json.dumps(e).encode('utf-8')
    req = urllib.request.Request(BASE, data=data, headers={'Content-Type':'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            print(r.status, r.read().decode())
    except Exception as ex:
        print('ERROR', e['language_code'], e['word'], ex)
