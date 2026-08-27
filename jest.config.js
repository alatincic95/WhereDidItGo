module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        strict: true,
        esModuleInterop: true,
        moduleResolution: 'node',
        module: 'commonjs',
        target: 'es2020',
        types: ['jest'],
      },
    }],
  },
  moduleNameMapper: {
    '^react-native$': '<rootDir>/src/__tests__/__mocks__/react-native.ts',
    '^@react-native-async-storage/async-storage$': '<rootDir>/src/__tests__/__mocks__/async-storage.ts',
    '^expo-file-system$': '<rootDir>/src/__tests__/__mocks__/expo-file-system.ts',
    '^expo-sharing$': '<rootDir>/src/__tests__/__mocks__/expo-sharing.ts',
  },
};
