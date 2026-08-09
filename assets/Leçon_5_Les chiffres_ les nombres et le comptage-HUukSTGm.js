const n=`{
  "titre_cours": "Leçon 5 : Les chiffres, les nombres et le comptage.",
  "niveau": "Débutant (A1 - A2)",
  "introduction": "Contenu construit strictement à partir du « Dictionnaire Français-Wolof et Wolof-Français », compilant les dictionnaires de Dard, du baron Roger et de l'abbé Lambert, revu et considérablement augmenté par les missionnaires de la Congrégation du Saint-Esprit et du Saint-Cœur de Marie (édition ancienne, Dakar/Saint-Louis du Sénégal). Ce document est une liste alphabétique française-wolof (mots et locutions), sans phrases dialoguées suivies ; l'orthographe d'origine (accents, apostrophes) est conservée telle quelle. L'extraction automatique de ce document scanné a pu déformer certains diacritiques (accents, lettres ñ/à propres au wolof) ; les transcriptions ci-dessous sont données sous cette réserve.",
  "modules": [
    {
      "id_module": 1,
      "titre_module": "Compter en wolof",
      "chapitres": [
        {
          "id_chapitre": 1,
          "titre": "Les nombres de 1 à 10",
          "contenu_detaille": "Le dictionnaire donne : 1 bènâ, 2 gnâr (ñaar), 3 gnètâ (ñett), 4 gnanènt (ñeent), 5 durom (juróom), 6 durombènâ (juróom-benn, litt. 5+1), 7 duromgnâr (juróom-ñaar, litt. 5+2), 8 duromgnètâ (juróom-ñett, litt. 5+3), 9 duromgnanètâ (juróom-ñeent, litt. 5+4), 10 fukâ.",
          "vocabulaire_cles": [
            {
              "terme": "bènâ",
              "traduction_ou_definition": "1"
            },
            {
              "terme": "gnâr",
              "traduction_ou_definition": "2"
            },
            {
              "terme": "gnètâ",
              "traduction_ou_definition": "3"
            },
            {
              "terme": "gnanènt",
              "traduction_ou_definition": "4"
            },
            {
              "terme": "durom",
              "traduction_ou_definition": "5"
            },
            {
              "terme": "durombènâ",
              "traduction_ou_definition": "6 (litt. 5+1)"
            },
            {
              "terme": "fukâ",
              "traduction_ou_definition": "10"
            }
          ],
          "exemples": [
            {
              "phrase": "bènâ, gnâr, gnètâ",
              "traduction": "1, 2, 3"
            },
            {
              "phrase": "fukâ",
              "traduction": "10"
            }
          ],
          "exercices": [
            {
              "question": "Comment dit-on '5' d'après le dictionnaire ?",
              "type": "QCM",
              "options": [
                "durom",
                "fukâ",
                "bènâ",
                "gnètâ"
              ],
              "reponse_correcte": "durom"
            },
            {
              "question": "'6' se dit 'durombènâ', littéralement 5 et _____ .",
              "type": "texte_a_trous",
              "options": [],
              "reponse_correcte": "1"
            }
          ]
        },
        {
          "id_chapitre": 2,
          "titre": "Onze, vingt et cent",
          "contenu_detaille": "Le dictionnaire donne 'gnârfukâ' (litt. 2 fois 10) pour « vingt », et 'témér' pour « cent ». Il donne aussi 'fak'ak bènâ' (litt. 10 et 1) pour « onze », et 'fuk'ak durum gnâr' (10 et 5+2) pour « dix-sept ».",
          "vocabulaire_cles": [
            {
              "terme": "gnârfukâ",
              "traduction_ou_definition": "vingt (litt. 2 fois 10)"
            },
            {
              "terme": "témér",
              "traduction_ou_definition": "cent"
            },
            {
              "terme": "fak'ak bènâ",
              "traduction_ou_definition": "onze (litt. 10 et 1)"
            }
          ],
          "exemples": [
            {
              "phrase": "gnârfukâ.",
              "traduction": "Vingt."
            },
            {
              "phrase": "témér.",
              "traduction": "Cent."
            },
            {
              "phrase": "fak'ak bènâ.",
              "traduction": "Onze."
            }
          ],
          "exercices": [
            {
              "question": "'Vingt' se dit en wolof : _____ .",
              "type": "texte_a_trous",
              "options": [],
              "reponse_correcte": "gnârfukâ"
            }
          ]
        },
        {
          "id_chapitre": 3,
          "titre": "Les nombres ordinaux",
          "contenu_detaille": "Le dictionnaire montre que les nombres ordinaux se forment en ajoutant le suffixe '-èl' au nombre cardinal : 'gnârèl' (deuxième, de gnâr), 'duromèl' (cinquième, de durom), 'durombènètèl' (sixième, de durombènâ), 'fukèl' (dixième, de fukâ), 'témérèl' (centième, de témér).",
          "vocabulaire_cles": [
            {
              "terme": "-èl",
              "traduction_ou_definition": "suffixe qui forme les nombres ordinaux"
            },
            {
              "terme": "gnârèl",
              "traduction_ou_definition": "deuxième"
            },
            {
              "terme": "fukèl",
              "traduction_ou_definition": "dixième"
            }
          ],
          "exemples": [
            {
              "phrase": "gnârèl.",
              "traduction": "Deuxième."
            },
            {
              "phrase": "fukèl.",
              "traduction": "Dixième."
            }
          ],
          "exercices": [
            {
              "question": "Quel suffixe transforme un nombre cardinal en nombre ordinal ?",
              "type": "QCM",
              "options": [
                "-èl",
                "-kat",
                "-ay",
                "-u"
              ],
              "reponse_correcte": "-èl"
            }
          ]
        }
      ]
    }
  ],
  "conclusion": "Cette leçon a présenté le système numéral du wolof (bènâ à fukâ), construit par addition à partir de 5, ainsi que vingt (gnârfukâ), cent (témér) et la formation des ordinaux avec le suffixe '-èl', issus du dictionnaire."
}`;export{n as default};
