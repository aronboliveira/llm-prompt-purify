/** @type {import("jest").Config} */
module.exports = {
  preset: "jest-preset-angular",
  setupFilesAfterEnv: ["<rootDir>/setup-jest.ts"],
  testEnvironment: "jsdom",
  roots: ["<rootDir>/src", "<rootDir>/tests/jest"],
  testMatch: ["**/*.spec.ts"],
  moduleFileExtensions: ["ts", "html", "js", "json"],
  moduleNameMapper: {
    "^@core/(.*)$": "<rootDir>/src/app/core/$1",
    "^@shared/(.*)$": "<rootDir>/src/app/shared/$1",
    "^@features/(.*)$": "<rootDir>/src/app/features/$1",
    "^@testing/(.*)$": "<rootDir>/src/app/testing/$1",
  },
  transform: {
    "^.+\\.(ts|mjs|js|html)$": [
      "jest-preset-angular",
      {
        stringifyContentPathRegex: "\\.(html|svg)$",
        tsconfig: "<rootDir>/tsconfig.spec.json",
      },
    ],
  },
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/main.ts",
    "!src/main.server.ts",
    "!src/**/*.d.ts",
  ],
  coverageDirectory: "<rootDir>/.tmp/project-overhaul/jest-coverage",
};
