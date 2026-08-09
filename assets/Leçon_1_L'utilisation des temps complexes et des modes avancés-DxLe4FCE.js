const e=`{
  "titre_cours": "Leçon 1 : L'utilisation des temps complexes et des modes avancés.",
  "niveau": "Avancé (C1 - C2)",
  "introduction": "Contenu construit entièrement à partir de recherches web (fiche « LE HINDI » du projet LGMEF/CNRS-INALCO, Preply, Talkpal, OpenL, notes de cours de hindi de l'INRIA, et recueils de proverbes hindi), le hindi étant une langue majeure parlée par plus de 600 millions de personnes en Inde et dans sa diaspora, largement documentée en ligne. ",
  "modules": [
    {
      "id_module": 1,
      "titre_module": "Le système des cas et des sujets variables",
      "chapitres": [
        {
          "id_chapitre": 1,
          "titre": "Trois patrons de sujet selon le type de verbe",
          "contenu_detaille": "La fiche LGMEF synthétise un système remarquable : selon le type sémantique du verbe, le sujet hindi se construit différemment. Les verbes transitifs au passé prennent un sujet oblique avec la postposition ergative 'ne' (accord du verbe avec le patient, vu en Leçon 4 du niveau intermédiaire) ; les verbes de sentiment/sensation/cognition prennent un sujet oblique avec 'ko' (accord du verbe avec l'entité perçue, vu en Leçon 3 du niveau intermédiaire) ; les autres verbes suivent une construction standard avec sujet au cas direct.",
          "vocabulaire_cles": [
            {
              "terme": "sujet + ने (ne, ergatif)",
              "traduction_ou_definition": "verbes transitifs au passé"
            },
            {
              "terme": "sujet + को (ko)",
              "traduction_ou_definition": "verbes de sentiment/sensation/cognition"
            },
            {
              "terme": "sujet direct",
              "traduction_ou_definition": "autres verbes, construction standard"
            }
          ],
          "exemples": [
            {
              "phrase": "(synthèse grammaticale de la fiche LGMEF)",
              "traduction": "Le hindi varie la construction du sujet (direct, ergatif+ne, oblique+ko) selon le type sémantique du verbe."
            }
          ],
          "exercices": [
            {
              "question": "Combien de patrons de construction du sujet la fiche LGMEF distingue-t-elle en hindi selon le type de verbe ?",
              "type": "QCM",
              "options": [
                "Trois : direct, ergatif (ne), oblique (ko)",
                "Un seul, toujours identique",
                "Cinq",
                "Dix"
              ],
              "reponse_correcte": "Trois : direct, ergatif (ne), oblique (ko)"
            }
          ]
        },
        {
          "id_chapitre": 2,
          "titre": "Une complexité qui dépasse le simple temps verbal",
          "contenu_detaille": "Ce système montre que le hindi n'organise pas son verbe uniquement autour du temps (passé/présent/futur) comme le français, mais aussi autour de l'alignement syntaxique (qui est traité comme 'sujet' grammatical selon le sens du verbe) — une dimension typologique avancée qui distingue fondamentalement le hindi des langues à alignement uniformément nominatif comme le français.",
          "vocabulaire_cles": [],
          "exemples": [],
          "exercices": [
            {
              "question": "Le hindi organise son verbe non seulement autour du temps, mais aussi autour de l'_____ syntaxique (qui est traité comme sujet).",
              "type": "texte_a_trous",
              "options": [],
              "reponse_correcte": "alignement"
            }
          ]
        }
      ]
    }
  ],
  "conclusion": "Cette leçon a synthétisé les trois patrons de construction du sujet en hindi selon le type de verbe (direct, ergatif avec ne, oblique avec ko), une dimension grammaticale avancée qui dépasse la simple expression du temps, d'après la fiche LGMEF/CNRS."
}`;export{e as default};
