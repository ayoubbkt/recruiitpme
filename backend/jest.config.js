module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/*.test.js'],
    collectCoverage: true,
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
      'controllers/**/*.js',
      'services/**/*.js',
      'utils/**/*.js',
      '!**/node_modules/**'
    ],
    setupFilesAfterEnv: ['./tests/setup.js']
  };