const e=`{
  "titre_cours": "Leçon 1 : L'utilisation des temps complexes et des modes avancés.",
  "niveau": "Avancé (C1 - C2)",
  "introduction": "Contenu construit strictement à partir du Dictionnaire Français-Soso et Soso-Français du R.P. Raimbault (2e édition, Mission Catholique de Conakry, 1921-1923) : chapitre grammatical 'Principes de la langue Soso', recueil de phrases usuelles, et entrées des dictionnaires français-soso et soso-français. L'orthographe d'origine (kh, gn, apostrophes, accents) est conservée telle quelle. Cette leçon s'appuie sur le Chapitre V 'Des verbes' et le Chapitre X 'Règles diverses' des 'Principes de la langue Soso'.",
  "modules": [
    {
      "id_module": 1,
      "titre_module": "Le système verbal du soso",
      "chapitres": [
        {
          "id_chapitre": 1,
          "titre": "Trois temps, trois modes",
          "contenu_detaille": "Le document indique que la théorie des verbes en soso ne semble pas très difficile : ils sont tous invariables. On distingue trois temps (le présent, le passé et le futur) et trois modes (l'indicatif, l'impératif et le subjonctif). Le présent de l'indicatif s'obtient simplement en faisant précéder l'infinitif des pronoms personnels : 'Nsèli' (je prie), 'ifa' (tu viens), 'asiga' (il part), 'mukhuali' (nous arrivons), 'wofala' (vous dites), 'ènigna' (ils font).",
          "vocabulaire_cles": [
            {
              "terme": "Nsèli",
              "traduction_ou_definition": "je prie"
            },
            {
              "terme": "ifa",
              "traduction_ou_definition": "tu viens"
            },
            {
              "terme": "asiga",
              "traduction_ou_definition": "il part"
            },
            {
              "terme": "wofala",
              "traduction_ou_definition": "vous dites"
            }
          ],
          "exemples": [
            {
              "phrase": "Nsèli.",
              "traduction": "Je prie."
            },
            {
              "phrase": "Asiga.",
              "traduction": "Il part."
            }
          ],
          "exercices": [
            {
              "question": "Combien de temps distingue le document dans le système verbal soso ?",
              "type": "QCM",
              "options": [
                "Trois (présent, passé, futur)",
                "Deux",
                "Quatre",
                "Cinq"
              ],
              "reponse_correcte": "Trois (présent, passé, futur)"
            }
          ]
        },
        {
          "id_chapitre": 2,
          "titre": "Le subjonctif et l'impératif",
          "contenu_detaille": "Le document explique qu'en mettant 'kha' après les pronoms personnels, on obtient le subjonctif présent ou futur : 'Nkhafa' (que je vienne), 'Ikhafa' (que tu viennes), 'Akhafa' (qu'il, qu'elle vienne), 'Wokhafa' (que vous veniez), 'Èkhafa' (qu'ils, qu'elles viennent). L'impératif se forme simplement avec le radical du verbe précédé, au pluriel, de 'wo' : 'Fa' (viens), 'Wofa' (venez), 'Wonfa' (venons). Le document précise qu'on n'emploie jamais 'mukhu' à l'impératif, puisqu'il exclut les personnes auxquelles on s'adresse.",
          "vocabulaire_cles": [
            {
              "terme": "kha",
              "traduction_ou_definition": "particule du subjonctif"
            },
            {
              "terme": "Nkhafa",
              "traduction_ou_definition": "que je vienne"
            },
            {
              "terme": "Wofa",
              "traduction_ou_definition": "venez"
            },
            {
              "terme": "Wonfa",
              "traduction_ou_definition": "venons"
            }
          ],
          "exemples": [
            {
              "phrase": "Akhafa.",
              "traduction": "Qu'il vienne."
            },
            {
              "phrase": "Wofa.",
              "traduction": "Venez."
            }
          ],
          "exercices": [
            {
              "question": "Quelle particule sert à former le subjonctif ?",
              "type": "QCM",
              "options": [
                "kha",
                "ma",
                "nu",
                "batta"
              ],
              "reponse_correcte": "kha"
            }
          ]
        },
        {
          "id_chapitre": 3,
          "titre": "Les formes passive et pronominale",
          "contenu_detaille": "Le document explique que l'on forme les verbes passifs en ajoutant 'khi' au radical : 'afa' (il vient), 'afakhi' (il est venu) ; 'birigndon' (mange tout), 'birigndonkhi' (tout est mangé). Dans les verbes pronominaux, le pronom complément se place immédiatement après le sujet au présent et au futur : 'Aamakoromanna' (il s'approche de moi). Au passé, il se place après 'batta', 'nakha' ou 'nu' : 'Ènakhaèkanbonmbo' (ils se sont frappés).",
          "vocabulaire_cles": [
            {
              "terme": "khi",
              "traduction_ou_definition": "suffixe qui forme le passif"
            },
            {
              "terme": "afakhi",
              "traduction_ou_definition": "il est venu (forme passive/résultative)"
            },
            {
              "terme": "Aamakoromanna",
              "traduction_ou_definition": "il s'approche de moi (construction pronominale)"
            }
          ],
          "exemples": [
            {
              "phrase": "Afakhi.",
              "traduction": "Il est venu."
            },
            {
              "phrase": "Birigndonkhi.",
              "traduction": "Tout est mangé."
            }
          ],
          "exercices": [
            {
              "question": "Le suffixe qui forme le passif en soso est : _____ .",
              "type": "texte_a_trous",
              "options": [],
              "reponse_correcte": "khi"
            }
          ]
        }
      ]
    }
  ],
  "conclusion": "Cette leçon a présenté le système verbal complet du soso (trois temps, trois modes) tel que décrit dans le dictionnaire de 1923 : indicatif, subjonctif en 'kha', impératif, ainsi que les formes passive (suffixe 'khi') et pronominale."
}`;export{e as default};
