/**
 * Jest Configuration for PF Scoring V7++
 */

module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/__tests__"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  collectCoverageFrom: [
    "lib/**/*.ts",
    "!lib/**/*.d.ts",
    "app/**/*.ts",
    "!app/**/*.d.ts",
  ],
  coveragePathIgnorePatterns: ["/node_modules/", "/.next/"],
  setupFilesAfterEnv: ["<rootDir>/__tests__/setup.ts"],
  globals: {
    "ts-jest": {
      tsconfig: {
        jsx: "react",
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    },
  },
};
