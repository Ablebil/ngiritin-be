module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "plugin:@typescript-eslint/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["./tsconfig.json", "./tsconfig.dev.json"],
    tsconfigRootDir: __dirname,
    sourceType: "module",
  },
  ignorePatterns: ["lib/**/*", "generated/**/*"],
  plugins: ["@typescript-eslint", "import"],
  rules: {
    quotes: ["error", "double"],
    indent: ["error", 2],
    "quote-props": "off",
    "import/no-unresolved": 0,
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": ["warn"],
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/ban-ts-comment": "off",
  },
};
