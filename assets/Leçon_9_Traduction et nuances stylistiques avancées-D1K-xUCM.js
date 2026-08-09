const e=`{
  "titre_cours": "Leçon 9 : Traduction et nuances stylistiques avancées.",
  "niveau": "Avancé (C1 - C2)",
  "introduction": "Contenu construit à partir de « A Complete Analysis of the Lýýma Language » de Wesley Sadler (thèse de 1949, village de Woozie, nord du Liberia), republiée et annotée par Valentin Vydrine (Mandenkan n°42, LLACAN/CNRS). C'est une grammaire de référence complète du looma/loma/toma (langue mandée parlée au Liberia et en Guinée forestière), avec un système de transcription phonétique propre à l'auteur (notamment le graphème ß pour une fricative labio-dentale sourde, et des marques toniques). Cette orthographe scientifique est conservée telle quelle ; elle diffère de l'alphabet pratique du loma utilisé en Guinée. Cette leçon reprend deux nuances essentielles décrites dans la grammaire : la longueur vocalique distinctive et l'ambiguïté temporelle du passé récent.",
  "modules": [
    {
      "id_module": 1,
      "titre_module": "Nuances de traduction en looma",
      "chapitres": [
        {
          "id_chapitre": 1,
          "titre": "La longueur vocalique, seul indice de sens",
          "contenu_detaille": "Comme vu en Leçon 3 du niveau débutant, la grammaire souligne que la longueur d'une voyelle peut être le seul élément distinguant deux mots : 'kaÉli' (houe) contre 'kaÉali' (serpent). Une traduction écrite qui ignorerait cette distinction, par exemple dans une transcription simplifiée sans marquage systématique de la longueur, risquerait la confusion entre deux mots au sens radicalement différent.",
          "vocabulaire_cles": [
            {
              "terme": "longueur vocalique",
              "traduction_ou_definition": "seul élément distinguant certaines paires de mots, comme kaÉli/kaÉali"
            }
          ],
          "exemples": [
            {
              "phrase": "kaÉli / kaÉali.",
              "traduction": "Houe / serpent (distingués uniquement par la longueur vocalique)."
            }
          ],
          "exercices": [
            {
              "question": "Que risque une traduction du looma qui ignorerait la longueur vocalique ?",
              "type": "QCM",
              "options": [
                "Une confusion entre des mots au sens radicalement différent",
                "Aucun risque particulier",
                "Une erreur de genre uniquement",
                "Une erreur de nombre uniquement"
              ],
              "reponse_correcte": "Une confusion entre des mots au sens radicalement différent"
            }
          ]
        },
        {
          "id_chapitre": 2,
          "titre": "L'ambiguïté du passé récent",
          "contenu_detaille": "La grammaire signale explicitement que le passé récent (RP) looma peut, selon le contexte, correspondre soit à une action tout juste achevée, soit à une action incomplète en cours ('koÉgi kÿÉÿ baÉ ga …aÉlo feÉlegý' peut se traduire « elle a été enceinte pendant deux mois » aussi bien que « elle est enceinte depuis deux mois »). Une traduction fixe et mécanique du RP par un seul temps français ferait perdre cette ambivalence, essentielle pour rendre fidèlement le sens du looma selon le contexte réel de l'énoncé.",
          "vocabulaire_cles": [
            {
              "terme": "ambiguïté du RP",
              "traduction_ou_definition": "le passé récent peut exprimer une action achevée ou une action incomplète en cours, selon le contexte"
            }
          ],
          "exemples": [
            {
              "phrase": "koÉgi kÿÉÿ baÉ ga …aÉlo feÉlegý.",
              "traduction": "Elle a été/est enceinte depuis deux mois (ambigu selon le contexte)."
            }
          ],
          "exercices": [
            {
              "question": "Le passé récent du looma peut être ambigu entre une action achevée et une action _____ en cours.",
              "type": "texte_a_trous",
              "options": [],
              "reponse_correcte": "incomplète"
            }
          ]
        }
      ]
    }
  ],
  "conclusion": "Cette leçon a présenté deux nuances essentielles à une traduction précise du looma : le rôle distinctif de la longueur vocalique, et l'ambiguïté temporelle du passé récent entre action achevée et action en cours, d'après la grammaire de Sadler."
}`;export{e as default};
