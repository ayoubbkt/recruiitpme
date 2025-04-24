// Dans tests/mocks/winston.js
const winston = {
    createLogger: jest.fn(() => ({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    })),
    format: {
      combine: jest.fn(),
      timestamp: jest.fn(),
      printf: jest.fn(),
      colorize: jest.fn(),
      json: jest.fn(),
      simple: jest.fn(),
      errors: jest.fn(),
      splat: jest.fn()
    },
    transports: {
      Console: jest.fn(),
      File: jest.fn()
    },
    addColors: jest.fn()
  };
  
  module.exports = winston;