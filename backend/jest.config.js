// Modifiez jest.config.js
module.exports = {
    // Répertoire racine où Jest cherchera les tests et fichiers
    rootDir: '.',
    
    // Les environnements dans lesquels les tests s'exécuteront
    testEnvironment: 'node',
    
    // Le pattern des fichiers de test
    testMatch: [
      '**/__tests__/**/*.js',
      '**/tests/**/*.js',
      '**/?(*.)+(spec|test).js'
    ],
    
    // Ignore certains répertoires
    testPathIgnorePatterns: [
      '/node_modules/',
      '/dist/',
      '/coverage/',
      '/logs/'
    ],
    
    // Fichiers à transformer avant les tests (ici, aucun)
    transform: {},
    
    // Couverture de code
    collectCoverage: true,
    collectCoverageFrom: [
      'controllers/**/*.js',
      'middleware/**/*.js',
      'routes/**/*.js',
      'services/**/*.js',
      'utils/**/*.js',
      '!**/node_modules/**'
    ],
    coverageDirectory: 'coverage',
    
    // Configuration des rapports de couverture
    coverageReporters: ['text', 'lcov', 'clover'],
    
    // Seuils de couverture minimale
    coverageThreshold: {
      global: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }
    },
    
    // Délai d'attente maximum pour les tests (10s)
    testTimeout: 10000,
    
    // Indique à Jest de nettoyer les mocks après chaque test
    clearMocks: true,
    
    // Configuration simplifiée sans setup global
    setupFilesAfterEnv: [],
    
    // Supprimer ces lignes qui causent l'erreur
    // globalSetup: './tests/globalSetup.js',
    // globalTeardown: './tests/globalTeardown.js',
    
    // Gestion de l'affichage
    verbose: true
  };