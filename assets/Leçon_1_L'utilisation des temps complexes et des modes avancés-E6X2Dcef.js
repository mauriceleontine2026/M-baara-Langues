const e=`{
  "titre_cours": "Leçon 1 : L'utilisation des temps complexes et des modes avancés.",
  "niveau": "Avancé (C1 - C2)",
  "introduction": "Contenu construit à partir de « A Complete Analysis of the Lýýma Language » de Wesley Sadler (thèse de 1949, village de Woozie, nord du Liberia), republiée et annotée par Valentin Vydrine (Mandenkan n°42, LLACAN/CNRS). C'est une grammaire de référence complète du looma/loma/toma (langue mandée parlée au Liberia et en Guinée forestière), avec un système de transcription phonétique propre à l'auteur (notamment le graphème ß pour une fricative labio-dentale sourde, et des marques toniques). Cette orthographe scientifique est conservée telle quelle ; elle diffère de l'alphabet pratique du loma utilisé en Guinée. Cette leçon synthétise le système temps-mode complet de la grammaire de Sadler, l'une des sections les plus développées de l'ouvrage.",
  "modules": [
    {
      "id_module": 1,
      "titre_module": "Le système temps-mode du looma",
      "chapitres": [
        {
          "id_chapitre": 1,
          "titre": "Quatre formes verbales principales",
          "contenu_detaille": "La grammaire distingue quatre formes principales du verbe looma : la forme de base ou présente, la forme progressive, le passé récent, et le passé lointain. Chacune se construit différemment selon que le verbe appartient à la classe des verbes en '-su' ou en '-zu' : par exemple 'toÉ' (construire) donne 'toÉsuØ' (en train de construire), 'toÉgaØ' (a construit), 'toÉni°' (a construit, il y a longtemps).",
          "vocabulaire_cles": [
            {
              "terme": "forme de base",
              "traduction_ou_definition": "présent, ordre, futur, permission selon le contexte"
            },
            {
              "terme": "progressive, RP, FP",
              "traduction_ou_definition": "les trois autres formes temporelles principales"
            }
          ],
          "exemples": [
            {
              "phrase": "toÉsuØ.",
              "traduction": "En train de construire."
            },
            {
              "phrase": "toÉni°.",
              "traduction": "A construit (il y a longtemps)."
            }
          ],
          "exercices": [
            {
              "question": "Combien de formes verbales principales la grammaire de Sadler distingue-t-elle ?",
              "type": "QCM",
              "options": [
                "Quatre : base, progressive, passé récent, passé lointain",
                "Deux seulement",
                "Six",
                "Huit, comme en français"
              ],
              "reponse_correcte": "Quatre : base, progressive, passé récent, passé lointain"
            }
          ]
        },
        {
          "id_chapitre": 2,
          "titre": "Les auxiliaires kaÉ, …ÿÉni, ÷ÿÉni",
          "contenu_detaille": "La grammaire décrit plusieurs auxiliaires qui enrichissent ce système : 'kaÉ' (futur/progressif après un acteur singulier défini), '…ÿÉni' (passé du plus-que-parfait ou du passé progressif : 'teÉ …ÿÉni woÉiãni°', ils avaient aimé), et son contraire négatif '÷ÿÉni' (toujours précédé de 'lÿÉ', pas) : 'tÿÉ lÿÉ ÷ÿÉni woÉiãni°' (ils n'avaient pas aimé).",
          "vocabulaire_cles": [
            {
              "terme": "…ÿÉni",
              "traduction_ou_definition": "auxiliaire du plus-que-parfait / passé progressif"
            },
            {
              "terme": "÷ÿÉni",
              "traduction_ou_definition": "contraire négatif de …ÿÉni, toujours avec lÿÉ"
            }
          ],
          "exemples": [
            {
              "phrase": "teÉ …ÿÉni woÉiãni°.",
              "traduction": "Ils avaient aimé."
            },
            {
              "phrase": "tÿÉ lÿÉ ÷ÿÉni woÉiãni°.",
              "traduction": "Ils n'avaient pas aimé."
            }
          ],
          "exercices": [
            {
              "question": "L'auxiliaire négatif, toujours précédé de 'lÿÉ' (pas), et contraire de …ÿÉni, est : _____ .",
              "type": "texte_a_trous",
              "options": [],
              "reponse_correcte": "÷ÿÉni"
            }
          ]
        },
        {
          "id_chapitre": 3,
          "titre": "Les verbes spéciaux et le présent progressif figé",
          "contenu_detaille": "La grammaire signale une catégorie de « verbes spéciaux » (comme 'daÉ' poser à plat, 'zeÉi' asseoir, 'sÿÉlÿ' suspendre, 'toÉ' tenir debout) qui utilisent le suffixe du passé lointain pour exprimer ce qui serait, en français, une action progressive présente : 'týÉ laÉani° beÉtei …aØ' se traduit par « Il est allongé sur le lit » (litt. il a posé-à-plat, il y a longtemps, sur le lit), et non par une forme progressive classique.",
          "vocabulaire_cles": [
            {
              "terme": "verbes spéciaux",
              "traduction_ou_definition": "catégorie de verbes (poser, asseoir, suspendre...) qui emploient le passé lointain pour un état présent"
            }
          ],
          "exemples": [
            {
              "phrase": "týÉ laÉani° beÉtei …aØ.",
              "traduction": "Il est allongé sur le lit."
            }
          ],
          "exercices": [
            {
              "question": "Quelle forme temporelle les 'verbes spéciaux' looma emploient-ils pour exprimer un état présent, d'après la grammaire ?",
              "type": "QCM",
              "options": [
                "Le passé lointain",
                "Le futur",
                "L'impératif",
                "Le progressif classique"
              ],
              "reponse_correcte": "Le passé lointain"
            }
          ]
        }
      ]
    }
  ],
  "conclusion": "Cette leçon a synthétisé le système temps-mode du looma (quatre formes principales, auxiliaires kaÉ/…ÿÉni/÷ÿÉni, et la catégorie particulière des « verbes spéciaux »), d'après la grammaire de Sadler."
}`;export{e as default};
