/** Jest config for Detox E2E tests (separate from unit tests). */
module.exports = {
  rootDir: "..",
  testMatch: ["<rootDir>/e2e/**/*.e2e.{ts,tsx,js}"],
  testTimeout: 120_000,
  maxWorkers: 1,
  transform: {
    "\\.[jt]sx?$": [
      "babel-jest",
      { configFile: "./babel.config.js" },
    ],
  },
  reporters: ["detox/runners/jest/reporter"],
  globalSetup: "detox/runners/jest/globalSetup",
  globalTeardown: "detox/runners/jest/globalTeardown",
  testEnvironment: "detox/runners/jest/testEnvironment",
  verbose: true,
};
