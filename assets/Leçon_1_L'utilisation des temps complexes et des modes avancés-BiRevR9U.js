const e=`{
  "titre_cours": "Leçon 1 : L'utilisation des temps complexes et des modes avancés.",
  "niveau": "Avancé (C1 - C2)",
  "introduction": "Contenu construit strictement à partir du « Précis de grammaire et de lexique du peul du Fouta Djallon » d'Abdourahmane Diallo (ILCAA, Tokyo University of Foreign Studies, 2015), qui documente le pular (variante du peul/fulfulde) parlé en Guinée. L'orthographe d'origine (ɓ, ɗ, ƴ, ɲ, ŋ, apostrophe glottale) est conservée telle quelle. Cette leçon synthétise le système verbal du pular tel que présenté dans les Leçons 10, 13, 18 et 21 du manuel (parfait, impératif, futur, prétérite).",
  "modules": [
    {
      "id_module": 1,
      "titre_module": "Le système verbal du pular",
      "chapitres": [
        {
          "id_chapitre": 1,
          "titre": "Trois voix systématiquement marquées",
          "contenu_detaille": "Le manuel montre que chaque temps du pular distingue systématiquement trois voix (active, moyenne, passive) par des morphèmes propres. Au parfait affirmatif : '-ii' (actif), '-ike' (moyen), '-aama' (passif) ; par exemple 'mi tappii Aamadu' (j'ai tapé Amadou, actif), 'mi tappike' (je me suis tapé, moyen), 'mi tappaama' (j'ai été tapé, passif). Au futur : '-ay' (actif), '-oto' (moyen), '-ete' (passif).",
          "vocabulaire_cles": [
            {
              "terme": "-ii / -ike / -aama",
              "traduction_ou_definition": "marques du parfait affirmatif (actif / moyen / passif)"
            },
            {
              "terme": "-ay / -oto / -ete",
              "traduction_ou_definition": "marques du futur (actif / moyen / passif)"
            }
          ],
          "exemples": [
            {
              "phrase": "Mi tappii Aamadu.",
              "traduction": "J'ai tapé Amadou (actif)."
            },
            {
              "phrase": "Mi tappaama.",
              "traduction": "J'ai été tapé (passif)."
            }
          ],
          "exercices": [
            {
              "question": "Combien de voix le système verbal du pular distingue-t-il systématiquement ?",
              "type": "QCM",
              "options": [
                "Trois (active, moyenne, passive)",
                "Deux",
                "Quatre",
                "Aucune distinction"
              ],
              "reponse_correcte": "Trois (active, moyenne, passive)"
            }
          ]
        },
        {
          "id_chapitre": 2,
          "titre": "Le prétérite -no combiné aux autres temps",
          "contenu_detaille": "Le manuel montre que le morphème '-no' peut se combiner à chaque temps et chaque voix pour exprimer une antériorité ou une nuance modale (regret, habitude). Ainsi 'o yahay' (il ira, futur simple) devient 'o yahayno' (il serait allé / il devrait aller), et 'ko kanko yahata' (c'est lui qui ira) devient 'ko kanko yahaynoo' (c'est lui qui allait souvent / qui devrait aller).",
          "vocabulaire_cles": [
            {
              "terme": "-no (combiné au futur)",
              "traduction_ou_definition": "exprime le conditionnel passé ou l'obligation non réalisée"
            }
          ],
          "exemples": [
            {
              "phrase": "O yahayno.",
              "traduction": "Il serait allé / il devrait aller."
            },
            {
              "phrase": "Ko kanko yahaynoo.",
              "traduction": "C'est lui qui devrait aller."
            }
          ],
          "exercices": [
            {
              "question": "Le morphème qui, combiné au futur, donne le sens de 'aurait dû' est : _____ .",
              "type": "texte_a_trous",
              "options": [],
              "reponse_correcte": "no"
            }
          ]
        },
        {
          "id_chapitre": 3,
          "titre": "L'impératif : un mode à part",
          "contenu_detaille": "Contrairement aux autres modes, l'impératif du pular n'a pas de forme passive (le manuel précise : « l'impératif n'est pas utilisé pour les verbes passifs en peul »), et il ne porte pas les mêmes marques de personne que l'indicatif : '-u' (2e sg.), '-ee' (2e pl.), '-en' (1e pl. inclusive) pour les actifs ; '-o', '-ee', '-oɗen' pour les moyens.",
          "vocabulaire_cles": [
            {
              "terme": "impératif actif",
              "traduction_ou_definition": "-u (sg.), -ee (pl.), -en (1e pl. incl.)"
            },
            {
              "terme": "impératif moyen",
              "traduction_ou_definition": "-o (sg.), -ee (pl.), -oɗen (1e pl. incl.)"
            }
          ],
          "exemples": [
            {
              "phrase": "Noddu!",
              "traduction": "Appelle !"
            },
            {
              "phrase": "Immo!",
              "traduction": "Lève-toi !"
            }
          ],
          "exercices": [
            {
              "question": "L'impératif existe-t-il à la voix passive en pular d'après le manuel ?",
              "type": "QCM",
              "options": [
                "Non, jamais",
                "Oui, systématiquement",
                "Seulement au pluriel",
                "Seulement avec -no"
              ],
              "reponse_correcte": "Non, jamais"
            }
          ]
        }
      ]
    }
  ],
  "conclusion": "Cette leçon a synthétisé le système verbal complexe du pular : le marquage systématique des trois voix à chaque temps, la combinaison du prétérite -no avec les autres temps pour exprimer des nuances modales, et les spécificités de l'impératif, d'après les Leçons 10, 13, 18 et 21 du manuel de 2015."
}`;export{e as default};
