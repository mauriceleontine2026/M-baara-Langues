const e=`{
  "titre_cours": "Leçon 1 : L'utilisation des temps complexes et des modes avancés.",
  "niveau": "Avancé (C1 - C2)",
  "introduction": "Contenu construit strictement à partir de « A Grammar of Kisi » (G. Tucker Childs, Mouton Grammar Library 16, Mouton de Gruyter, 1995), une grammaire universitaire du kisi (kissi), langue atlantique méridionale parlée en Guinée, au Liberia et en Sierra Leone. Ce document est entièrement rédigé en anglais et destiné aux linguistes ; il ne s'agit pas d'un manuel d'apprentissage. Les faits, exemples et gloses qu'il contient ont été traduits et reformulés en français pour ce cours, sans ajout d'information extérieure. Avertissement technique : le kisi est une langue à tons, et l'ouvrage transcrit systématiquement les tons et plusieurs voyelles/consonnes spécifiques (ɔ, ɛ, ŋ, voyelles nasales, marques tonales) au moyen de caractères phonétiques spéciaux ; l'extraction automatique du texte de ce PDF universitaire a pu déformer certains de ces caractères. Les formes kisi citées ci-dessous sont donc données sous toute réserve quant à leurs diacritiques exacts, et gagneraient à être vérifiées auprès d'un locuteur ou du PDF original avant tout usage pédagogique. Cette leçon synthétise le chapitre 10 de l'ouvrage (Morphologie flexionnelle), qui décrit le système temporel/aspectuel complet du kisi.",
  "modules": [
    {
      "id_module": 1,
      "titre_module": "Le système temporel-aspectuel du kisi",
      "chapitres": [
        {
          "id_chapitre": 1,
          "titre": "Un inventaire riche : Habituel, Perfectif, Progressif, Futur, Parfait",
          "contenu_detaille": "L'ouvrage distingue, pour les verbes réguliers, un nombre important de catégories flexionnelles : l'Habituel (action coutumière, sans référence temporelle précise), le Perfectif (action ou état accompli), l'Hortatif et l'Impératif, l'Habituel passé, le Progressif présent, le Progressif passé, le Futur, le Futur progressif, et le Parfait. Ce dernier, note l'ouvrage, utilise le mot 'riiŋ', transparent avec le mot pour « maintenant », ce qui montre que le Parfait kisi reste ancré dans la pertinence présente de l'action passée.",
          "vocabulaire_cles": [
            {
              "terme": "Habituel",
              "traduction_ou_definition": "action coutumière, sans référence temporelle précise, qui se poursuit"
            },
            {
              "terme": "Parfait (riiŋ)",
              "traduction_ou_definition": "utilise un mot apparenté à « maintenant », marque la pertinence présente d'une action passée"
            }
          ],
          "exemples": [
            {
              "phrase": "lɔ-ɔ-lɔ ŋ sää sɔŋ.",
              "traduction": "« Elle tient toujours le poulet. » (exemple de l'ouvrage, Habituel)"
            }
          ],
          "exercices": [
            {
              "question": "À quel mot est apparenté le marqueur du Parfait 'riiŋ', d'après l'ouvrage ?",
              "type": "QCM",
              "options": [
                "« maintenant »",
                "« hier »",
                "« demain »",
                "« toujours »"
              ],
              "reponse_correcte": "« maintenant »"
            }
          ]
        },
        {
          "id_chapitre": 2,
          "titre": "L'irrégularité tonale, marque des catégories flexionnelles",
          "contenu_detaille": "L'ouvrage souligne que c'est essentiellement le ton, plus que la forme segmentale du verbe, qui distingue les catégories flexionnelles en kisi. Ainsi le Perfectif régulier porte un schéma Bas-Haut, la Négative générale porte un schéma Bas-Haut-Extra-Haut (avec un ton « extra-haut » plus élevé que le Haut habituel, et une durée/intensité syllabique accrue), et l'Hortatif porte, sauf à la deuxième personne, un schéma Bas-Haut identique à celui du Parfait.",
          "vocabulaire_cles": [
            {
              "terme": "ton extra-haut",
              "traduction_ou_definition": "ton distinctif de la négation générale, plus élevé que le ton haut habituel"
            },
            {
              "terme": "irrégularité tonale",
              "traduction_ou_definition": "principal moyen par lequel le kisi distingue les catégories flexionnelles du verbe"
            }
          ],
          "exemples": [
            {
              "phrase": "ö tu le.",
              "traduction": "« Il n'a pas mesuré. » (exemple de l'ouvrage, Négatif général avec ton extra-haut)"
            }
          ],
          "exercices": [
            {
              "question": "D'après l'ouvrage, ce qui distingue le plus souvent les catégories flexionnelles du verbe kisi, plus que la forme du mot elle-même, est : le _____ .",
              "type": "texte_a_trous",
              "options": [],
              "reponse_correcte": "ton"
            }
          ]
        }
      ]
    }
  ],
  "conclusion": "Cette leçon a synthétisé la richesse du système temporel-aspectuel du kisi (Habituel, Perfectif, Progressif, Futur, Parfait) et le rôle central du ton dans la distinction de ces catégories, d'après le chapitre 10 de l'ouvrage de Childs."
}`;export{e as default};
