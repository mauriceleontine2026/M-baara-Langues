const e=`{
  "titre_cours": "Leçon 3 : L'alphabet et les sons spécifiques de la langue.",
  "niveau": "Débutant (A1 - A2)",
  "introduction": "Contenu construit strictement à partir du document fourni. Note importante : ce document est en réalité le « Petit Dictionnaire Français-Bambara et Bambara-Français » de Moussa Travélé (Librairie Paul Geuthner, Paris, début du XXe siècle), consacré au bambara — une langue mandingue très proche du malinké, à laquelle le dictionnaire lui-même fait plusieurs fois référence explicite sous l'abréviation 'M.' (mot malinké). En l'absence d'un dictionnaire malinké dédié, ce cours utilise fidèlement ce contenu bambara/malinké, sans y ajouter aucune information extérieure. Ce dictionnaire est une liste alphabétique de mots (deux sens) et ne contient ni phrases dialoguées ni tableaux de conjugaison ; les leçons ci-dessous s'appuient donc sur le vocabulaire isolé qu'il fournit, complété quand cela existe par les 'Observations préliminaires' sur la prononciation. Cette leçon reprend les « Observations préliminaires » du dictionnaire (I. De l'alphabet, II. De la prononciation).",
  "modules": [
    {
      "id_module": 1,
      "titre_module": "Les sons du bambara/malinké",
      "chapitres": [
        {
          "id_chapitre": 1,
          "titre": "Les remarques de prononciation",
          "contenu_detaille": "Le dictionnaire précise que les lettres de l'alphabet français conviennent à rendre les sons du bambara, avec quelques exceptions : le 'h' est toujours aspiré ; le 'r' est toujours roulé sur la langue et non grasseyé « comme l'r des Parisiens » ; le 's' est toujours dur et n'a jamais le son du 'z' ; le groupe 'oi' se prononce 'wa' comme dans le français « bois, loi » ; le groupe 'gn', même en début de mot, se prononce comme dans le français « agneau, dignité ».",
          "vocabulaire_cles": [
            {
              "terme": "h",
              "traduction_ou_definition": "toujours aspiré"
            },
            {
              "terme": "r",
              "traduction_ou_definition": "toujours roulé sur la langue"
            },
            {
              "terme": "s",
              "traduction_ou_definition": "toujours dur, jamais comme un z"
            },
            {
              "terme": "oi",
              "traduction_ou_definition": "se prononce 'wa' (comme dans 'bois, loi')"
            },
            {
              "terme": "gn",
              "traduction_ou_definition": "comme dans le français 'agneau', même en début de mot"
            }
          ],
          "exemples": [
            {
              "phrase": "dji",
              "traduction": "eau (illustre le son 'dj')"
            },
            {
              "phrase": "tié",
              "traduction": "homme (illustre le son 'ti')"
            }
          ],
          "exercices": [
            {
              "question": "Comment se prononce le 'r' en bambara/malinké d'après le dictionnaire ?",
              "type": "QCM",
              "options": [
                "Toujours roulé sur la langue",
                "Grasseyé comme à Paris",
                "Muet",
                "Comme un l"
              ],
              "reponse_correcte": "Toujours roulé sur la langue"
            },
            {
              "question": "Le groupe 'oi' se prononce comme le son français : _____ .",
              "type": "texte_a_trous",
              "options": [],
              "reponse_correcte": "wa"
            }
          ]
        },
        {
          "id_chapitre": 2,
          "titre": "Les sons spécifiques dj/tj et les tons",
          "contenu_detaille": "Le dictionnaire signale deux consonnes sans équivalent exact en français, transcrites 'dj'/'di' et 'tj'/'ti', dont le son s'obtient en rapprochant davantage la langue du palais que pour le français (exemples : 'dji' « eau », 'diara' « lion », 'tié' « homme »). Il précise aussi que l'accent tonique distingue le sens de mots à l'orthographe identique : un accent circonflexe marque une voyelle longue (ex. 'ma' « être humain » vs 'mâ' « lamantin »), et un trait horizontal marque un ton bas et grave.",
          "vocabulaire_cles": [
            {
              "terme": "dj / di",
              "traduction_ou_definition": "son spécifique, langue rapprochée du palais (ex. dji, eau)"
            },
            {
              "terme": "tj / ti",
              "traduction_ou_definition": "son spécifique, langue rapprochée du palais (ex. tié, homme)"
            },
            {
              "terme": "accent circonflexe",
              "traduction_ou_definition": "marque une voyelle longue, change le sens du mot"
            },
            {
              "terme": "trait horizontal",
              "traduction_ou_definition": "marque un ton bas et grave, change le sens du mot"
            }
          ],
          "exemples": [
            {
              "phrase": "dji",
              "traduction": "eau"
            },
            {
              "phrase": "diara",
              "traduction": "lion"
            },
            {
              "phrase": "tié",
              "traduction": "homme"
            }
          ],
          "exercices": [
            {
              "question": "Le mot 'dji', qui illustre le son spécifique 'dj', signifie : _____ .",
              "type": "texte_a_trous",
              "options": [],
              "reponse_correcte": "eau"
            }
          ]
        }
      ]
    }
  ],
  "conclusion": "Cette leçon a présenté les remarques de prononciation du dictionnaire de Moussa Travélé : les particularités du h, du r, du s, du groupe oi et gn, les consonnes spécifiques dj/tj, et le rôle des accents dans la distinction du sens."
}`;export{e as default};
