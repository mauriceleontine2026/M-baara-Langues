const e=`{
  "titre_cours": "Leçon 9 : Traduction et nuances stylistiques avancées.",
  "niveau": "Avancé (C1 - C2)",
  "introduction": "Contenu construit strictement à partir du document fourni. Note importante : ce document est en réalité le « Petit Dictionnaire Français-Bambara et Bambara-Français » de Moussa Travélé (Librairie Paul Geuthner, Paris, début du XXe siècle), consacré au bambara — une langue mandingue très proche du malinké, à laquelle le dictionnaire lui-même fait plusieurs fois référence explicite sous l'abréviation 'M.' (mot malinké). En l'absence d'un dictionnaire malinké dédié, ce cours utilise fidèlement ce contenu bambara/malinké, sans y ajouter aucune information extérieure. Ce dictionnaire est une liste alphabétique de mots (deux sens) et ne contient ni phrases dialoguées ni tableaux de conjugaison ; les leçons ci-dessous s'appuient donc sur le vocabulaire isolé qu'il fournit, complété quand cela existe par les 'Observations préliminaires' sur la prononciation.",
  "modules": [
    {
      "id_module": 1,
      "titre_module": "Nuances de traduction",
      "chapitres": [
        {
          "id_chapitre": 1,
          "titre": "Les tons comme outil de distinction du sens",
          "contenu_detaille": "Comme signalé dans les 'Observations préliminaires', le dictionnaire précise que des mots d'orthographe identique peuvent avoir des sens très différents selon leur ton : 'ma' avec un accent circonflexe (voyelle longue) signifie 'être humain, personne', tandis que 'mâ' sans plus de précision peut aussi signifier 'lamantin' selon le contexte ; de même, 'hàla' (ton bas et grave, marqué par un trait horizontal) signifie 'porc-épic', tandis que 'hala' signifie 'balafon'. Une traduction fidèle du bambara/malinké exige donc une attention constante aux tons, qu'une simple liste de mots comme ce dictionnaire ne peut qu'imparfaitement représenter par écrit.",
          "vocabulaire_cles": [
            {
              "terme": "accent circonflexe",
              "traduction_ou_definition": "marque une voyelle longue, distingue le sens (ex. mâ, lamantin)"
            },
            {
              "terme": "trait horizontal",
              "traduction_ou_definition": "marque un ton bas et grave, distingue le sens (ex. hàla, porc-épic vs hala, balafon)"
            }
          ],
          "exemples": [
            {
              "phrase": "mâ.",
              "traduction": "Lamantin (ton long)."
            },
            {
              "phrase": "hàla / hala.",
              "traduction": "Porc-épic / balafon (distingués par le ton)."
            }
          ],
          "exercices": [
            {
              "question": "D'après le dictionnaire, qu'est-ce qui distingue 'hàla' (porc-épic) de 'hala' (balafon) ?",
              "type": "QCM",
              "options": [
                "Le ton (bas et grave, marqué par un trait horizontal)",
                "L'orthographe complètement différente",
                "Le genre du mot",
                "Rien, ce sont des synonymes"
              ],
              "reponse_correcte": "Le ton (bas et grave, marqué par un trait horizontal)"
            }
          ]
        },
        {
          "id_chapitre": 2,
          "titre": "La virgule comme marque de synonymie régionale",
          "contenu_detaille": "Le dictionnaire précise dans ses abréviations que la virgule, employée entre synonymes, « remplace 'ou bien' » et signale des variantes employées dans différentes régions. Une traduction précise doit donc tenir compte du fait qu'une entrée donnant plusieurs mots séparés par des virgules (par exemple pour 'chemin' : 'Sira') ne propose pas nécessairement des synonymes parfaits, mais parfois des variantes dialectales à choisir selon la région du locuteur.",
          "vocabulaire_cles": [
            {
              "terme": "virgule (,)",
              "traduction_ou_definition": "dans le dictionnaire, remplace 'ou bien' entre synonymes régionaux"
            }
          ],
          "exemples": [
            {
              "phrase": "Sira.",
              "traduction": "Chemin (variante régionale possible selon le dictionnaire)."
            }
          ],
          "exercices": [
            {
              "question": "Dans ce dictionnaire, la virgule entre deux traductions remplace l'expression : ou _____ .",
              "type": "texte_a_trous",
              "options": [],
              "reponse_correcte": "bien"
            }
          ]
        }
      ]
    }
  ],
  "conclusion": "Cette leçon a présenté deux nuances essentielles à une traduction précise à partir de ce dictionnaire : le rôle distinctif des tons (accent circonflexe, trait horizontal) et le sens exact de la virgule, qui signale des variantes régionales plutôt que des synonymes stricts."
}`;export{e as default};
