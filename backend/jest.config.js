module.exports = {
    testEnvironment: 'node',
    modulePaths: ['node_modules', 'src'],
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/$1',
      '^winston$': '<rootDir>/tests/mocks/winston.js'
    },
    roots: ['<rootDir>'],
    testMatch: ['**/tests/**/*.test.js'],
    collectCoverageFrom: [
      '**/*.js',
      '!**/node_modules/**',
      '!**/coverage/**',
      '!jest.config.js'
    ],
    coverageThreshold: {
      global: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80
      }
    },
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    globalSetup: '<rootDir>/tests/globalSetup.js',
globalTeardown: '<rootDir>/tests/globalTeardown.js',
  };