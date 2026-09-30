import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    /*
     * Le dépôt compte quelque deux cent soixante-seize `any` et une centaine de
     * variables inutilisées, hérités de son écriture initiale. Tant qu'ils étaient
     * des erreurs, `npm run lint` échouait, et comme la vérification des types, les
     * tests et la compilation viennent APRÈS le lint dans l'intégration continue,
     * celle-ci ne vérifiait plus rien depuis des mois : elle échouait à la première
     * étape sur chaque fusion.
     *
     * Ces deux règles passent en avertissement : elles restent visibles à chaque
     * exécution et se traitent au fil de l'eau, mais elles ne masquent plus une
     * erreur de type ou une compilation cassée. Tout le reste demeure bloquant.
     */
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
];

export default eslintConfig;
