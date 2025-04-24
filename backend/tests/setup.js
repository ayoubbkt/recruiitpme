// Configuration global pour Jest


// Configuration des tests après le chargement de l'environnement

// Augmenter le timeout des tests pour les opérations de base de données
jest.setTimeout(30000);
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'A5f8WMizOUTjlsyfVRpfqfbwbt4SOPaUTnVk143/PbRYGaJ7bWn/Ysy2mLD2tPzi945ONCvLUcxxDE0nx6785w==';
process.env.JWT_EXPIRES_IN = '1h';


process.env.CV_PARSER_SERVICE_URL = 'http://localhost:5000/parse';
process.env.MAX_FILE_SIZE = '10485760'; // 10MB

// Ajouter des matchers Jest personnalisés si nécessaire
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});