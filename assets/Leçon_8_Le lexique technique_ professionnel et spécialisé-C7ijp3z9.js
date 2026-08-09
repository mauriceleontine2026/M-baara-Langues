const e=`{
  "titre_cours": "Leçon 8 : Le lexique technique, professionnel et spécialisé.",
  "niveau": "Avancé (C1 - C2)",
  "introduction": "Cette leçon explore deux registres techniques présents dans le Dictionnaire kpele de la Guinée de Maria Konoshenko (2019, Mandenkan n°62) : le lexique de la justice et de la santé traditionnelle, et le métalangage scientifique que le dictionnaire emploie lui-même — nomenclature botanique et zoologique latine, et abréviations grammaticales.",
  "modules": [
    {
      "id_module": 1,
      "titre_module": "Justice et santé",
      "chapitres": [
        {
          "id_chapitre": 1,
          "titre": "Le vocabulaire du jugement et du soin",
          "contenu_detaille": "Le jugement ou le procès se dit kíti, avec l'expression ~ téɠe 'juger'. Le médicament se dit háli ; ce même mot désigne aussi, dans un second sens relationnel, l'amulette, le talisman ou le gris-gris (nom générique de la pharmacopée traditionnelle). Le docteur se dit yɔ̀ɠɔtɔ́lɔ̂.",
          "vocabulaire_cles": [
            {"terme": "kíti", "traduction_ou_definition": "jugement, procès"},
            {"terme": "háli", "traduction_ou_definition": "médicament ; aussi amulette, talisman, gris-gris"},
            {"terme": "yɔ̀ɠɔtɔ́lɔ̂", "traduction_ou_definition": "docteur"}
          ],
          "exemples": [
            {"phrase": "kíti ~ téɠe", "traduction": "'juger'"}
          ],
          "exercices": [
            {
              "question": "Comment dit-on 'jugement, procès' en kpele ?",
              "type": "QCM",
              "options": ["háli", "kíti", "yɔ̀ɠɔtɔ́lɔ̂", "hɔ́ɔnŋ"],
              "reponse_correcte": "kíti"
            },
            {
              "question": "Le mot háli désigne un médicament, mais aussi, dans un sens relationnel, ___.",
              "type": "texte_a_trous",
              "options": [],
              "reponse_correcte": "une amulette, un talisman, un gris-gris"
            }
          ]
        }
      ]
    },
    {
      "id_module": 2,
      "titre_module": "Le métalangage du dictionnaire",
      "chapitres": [
        {
          "id_chapitre": 1,
          "titre": "La nomenclature scientifique latine",
          "contenu_detaille": "Pour les plantes et les animaux, le dictionnaire précise systématiquement le nom scientifique latin de l'espèce lorsqu'il est disponible — une pratique empruntée à la terminologie botanique et zoologique internationale. On trouve ainsi ɓàmánàa 'Canna indica, arbre sp. (utilisé pour préparer des médicaments)', ɓáhi 'Terminalia ivoriensis, arbre sp. (on fabrique de la teinture jaune avec son écorce)', et kpògîeŋ 'Aframomum melegueta, herbe sp. (utilisée pour préparer des médicaments)'.",
          "vocabulaire_cles": [
            {"terme": "ɓàmánàa", "traduction_ou_definition": "Canna indica (arbre utilisé pour préparer des médicaments)"},
            {"terme": "ɓáhi", "traduction_ou_definition": "Terminalia ivoriensis (arbre à teinture jaune)"},
            {"terme": "kpògîeŋ", "traduction_ou_definition": "Aframomum melegueta (herbe médicinale)"}
          ],
          "exemples": [
            {"phrase": "ɓàmánàa n Canna indica", "traduction": "'arbre sp., utilisé pour préparer des médicaments'"},
            {"phrase": "ɓáhi n Terminalia ivoriensis", "traduction": "'arbre sp., on fabrique de la teinture jaune avec son écorce'"}
          ],
          "exercices": [
            {
              "question": "Pourquoi le dictionnaire donne-t-il le nom scientifique latin de nombreuses plantes et animaux ?",
              "type": "QCM",
              "options": ["par tradition religieuse", "pour suivre la terminologie botanique et zoologique internationale", "parce que le kpele n'a pas de mots pour ces espèces", "c'est une erreur d'impression"],
              "reponse_correcte": "pour suivre la terminologie botanique et zoologique internationale"
            },
            {
              "question": "Quel nom scientifique latin correspond au mot kpele kpògîeŋ ?",
              "type": "QCM",
              "options": ["Canna indica", "Terminalia ivoriensis", "Aframomum melegueta", "Terminalia superba"],
              "reponse_correcte": "Aframomum melegueta"
            }
          ]
        },
        {
          "id_chapitre": 2,
          "titre": "Les abréviations grammaticales du dictionnaire",
          "contenu_detaille": "Le dictionnaire emploie son propre métalangage grammatical, résumé dans un tableau d'abréviations : n (nom), v (verbe), vi (verbe intransitif), vt (verbe transitif), vr (verbe réfléchi), adj (adjectif), adv (adverbe), num (numéral), conj (conjonction), pm (marqueur prédicatif), dtm (déterminatif), itj (interjection), qual (qualificatif), rn (nom relationnel), pp (postposition), part (particule), cop (copule), Syn. (synonyme), Ant. (antonyme), Dist. (distribution syntaxique des qualificatifs). Ce système, cohérent sur presque 3000 entrées, constitue lui-même un objet d'étude technique pour qui veut comprendre la structure grammaticale du kpele.",
          "vocabulaire_cles": [
            {"terme": "rn", "traduction_ou_definition": "nom relationnel (abréviation du dictionnaire)"},
            {"terme": "pm", "traduction_ou_definition": "marqueur prédicatif (abréviation du dictionnaire)"},
            {"terme": "Dist.", "traduction_ou_definition": "distribution syntaxique des qualificatifs (abréviation du dictionnaire)"}
          ],
          "exemples": [
            {"phrase": "n, v, vi, vt, vr", "traduction": "nom, verbe, verbe intransitif, verbe transitif, verbe réfléchi"},
            {"phrase": "conj, pm, dtm, itj, qual", "traduction": "conjonction, marqueur prédicatif, déterminatif, interjection, qualificatif"}
          ],
          "exercices": [
            {
              "question": "Que signifie l'abréviation 'rn' dans le dictionnaire ?",
              "type": "QCM",
              "options": ["nom relationnel", "nom régulier", "racine nominale", "nom rare"],
              "reponse_correcte": "nom relationnel"
            },
            {
              "question": "L'abréviation ___ désigne le marqueur prédicatif dans le système du dictionnaire.",
              "type": "texte_a_trous",
              "options": [],
              "reponse_correcte": "pm"
            }
          ]
        }
      ]
    }
  ],
  "conclusion": "Cette leçon a exploré le lexique technique du kpele à travers deux angles : le vocabulaire spécialisé de la justice et de la santé traditionnelle (kíti, háli, yɔ̀ɠɔtɔ́lɔ̂), et le métalangage scientifique du dictionnaire lui-même — nomenclature latine pour la flore et la faune, et système d'abréviations grammaticales. Ces données, tirées du Dictionnaire kpele de la Guinée (Konoshenko, 2019), montrent que le dictionnaire est lui-même un exemple de discours technique et spécialisé."
}`;export{e as default};
