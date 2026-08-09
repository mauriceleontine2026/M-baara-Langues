const e=`{
  "titre_cours": "Leçon 3 : L'alphabet et les sons spécifiques de la langue.",
  "niveau": "Débutant (A1 - A2)",
  "introduction": "Contenu construit strictement à partir du « Dictionnaire Dioula-Français-Anglais-Allemand » (dernière mise à jour du 28/12/2020), un dictionnaire moderne et très complet (plus de 1200 pages) documentant le dioula (jula) parlé autour de Bobo-Dioulasso, Burkina Faso — une langue mandingue très proche du malinké et du bambara déjà utilisés dans ce projet. Ce dictionnaire est exceptionnellement riche : chaque entrée est classée par catégorie sémantique (Kinship, colour, Food, Mathematics, etc.), donnée avec tons, traduction quadrilingue et souvent un exemple de phrase authentique. Cette leçon reprend le système de notation tonale employé systématiquement par le dictionnaire.",
  "modules": [
    {
      "id_module": 1,
      "titre_module": "Les tons du dioula",
      "chapitres": [
        {
          "id_chapitre": 1,
          "titre": "Une notation tonale systématique",
          "contenu_detaille": "Le dictionnaire indique, entre crochets, le patron tonal de chaque mot au moyen d'accents (aigu pour le ton haut, absence de marque ou variantes pour le ton bas), syllabe par syllabe : par exemple 'adamaden' (être humain) est noté [á-á-à-ẽ́], ce qui montre un ton haut sur les deux premières syllabes, bas sur la troisième, et haut nasalisé sur la dernière. Cette notation systématique, présente pour la quasi-totalité des entrées, souligne l'importance du ton comme trait distinctif du dioula.",
          "vocabulaire_cles": [
            {
              "terme": "[á]",
              "traduction_ou_definition": "ton haut, marqué par un accent aigu"
            },
            {
              "terme": "notation syllabe par syllabe",
              "traduction_ou_definition": "chaque syllabe du mot reçoit sa propre marque tonale entre crochets"
            }
          ],
          "exemples": [
            {
              "phrase": "adamaden [á-á-à-ẽ́]",
              "traduction": "être humain (avec son patron tonal complet)."
            }
          ],
          "exercices": [
            {
              "question": "Comment le dictionnaire note-t-il le ton de chaque mot ?",
              "type": "QCM",
              "options": [
                "Par des accents entre crochets, syllabe par syllabe",
                "Il ne note pas les tons",
                "Par des chiffres après le mot",
                "Par des couleurs"
              ],
              "reponse_correcte": "Par des accents entre crochets, syllabe par syllabe"
            }
          ]
        },
        {
          "id_chapitre": 2,
          "titre": "Des voyelles nasalisées distinctives",
          "contenu_detaille": "Les transcriptions toniques du dictionnaire montrent aussi la présence de voyelles nasalisées, notées avec un tilde (ex. 'ẽ́' dans adamaden), qui se distinguent des voyelles orales correspondantes. Cette combinaison de tons et de nasalisation, ajoutée aux consonnes propres au mandingue comme 'ɲ', 'ɔ', 'ɛ' et 'ŋ', donne au dioula un système phonologique riche, hérité de sa parenté avec le malinké et le bambara déjà documentés dans ce projet.",
          "vocabulaire_cles": [
            {
              "terme": "ẽ́ (voyelle nasalisée)",
              "traduction_ou_definition": "voyelle nasale, notée par un tilde"
            },
            {
              "terme": "ɲ, ɔ, ɛ, ŋ",
              "traduction_ou_definition": "consonnes/voyelles spécifiques au mandingue, communes au dioula, au malinké et au bambara"
            }
          ],
          "exemples": [
            {
              "phrase": "adamaden.",
              "traduction": "Être humain (illustre la nasalisation finale)."
            }
          ],
          "exercices": [
            {
              "question": "Les voyelles nasalisées sont notées par le dictionnaire au moyen d'un _____ .",
              "type": "texte_a_trous",
              "options": [],
              "reponse_correcte": "tilde"
            }
          ]
        }
      ]
    }
  ],
  "conclusion": "Cette leçon a présenté le système de notation tonale systématique du dictionnaire dioula (tons hauts/bas par syllabe, voyelles nasalisées), qui souligne la parenté phonologique du dioula avec le malinké et le bambara déjà étudiés dans ce projet."
}`;export{e as default};
