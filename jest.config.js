module.exports = {
  setupFilesAfterEnv: ['./jest/setup.ts'],
  preset: 'react-native',
  modulePathIgnorePatterns: [
    '<rootDir>/example/node_modules',
    '<rootDir>/dist/',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!**/node_modules/**',
    '!src/**/*.d.ts',
    '!src/**/*.js',
    '!src/**/*.constants.{ts}',
    '!src/**/*.interface.{ts}',
  ],
  coveragePathIgnorePatterns: [
    'node_modules',
    'src/.*/*..(js|d.ts)',
    'src/.*/*..constants.ts',
    'src/.*/*..interface.ts',
  ],
  coverageReporters: ['lcov', ['text', { skipFull: true }]],
};
