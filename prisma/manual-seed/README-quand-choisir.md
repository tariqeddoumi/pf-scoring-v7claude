# Textes « quand choisir » des options de scoring

Le fichier `charger-quand-choisir.sql` renseigne, pour chacune des 336 options du
modèle, la phrase qui décrit dans quel cas la retenir. Le chargement initial du modèle
n'avait repris ces textes que pour 24 options, et sous forme tronquée.

Ce texte est ce qui permet à un chargé d'affaires de trancher entre deux réponses
voisines sans rouvrir le guide de saisie. Il est affiché sous chaque réponse dans le
poste de saisie.

Source : `prisma/migrations/20260524_v7pp_complete_from_excel/source_data.json`,
champ `options[].when_choose`. Le rapprochement se fait par le code de l'option
(`D1_SC1_SSC1_OPT1`…), qui est stable d'une version du modèle à l'autre : le script
met donc à jour toutes les versions en une fois.

Script idempotent : il peut être rejoué sans effet de bord.
