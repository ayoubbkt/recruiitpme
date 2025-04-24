// Configuration global pour Jest
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'A5f8WMizOUTjlsyfVRpfqfbwbt4SOPaUTnVk143/PbRYGaJ7bWn/Ysy2mLD2tPzi945ONCvLUcxxDE0nx6785w==';
process.env.JWT_EXPIRES_IN = '1h';


// Mocking des dépendances externes que nous ne voulons pas tester
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

// Suppression des mocks après chaque test
afterEach(() => {
  jest.clearAllMocks();
});