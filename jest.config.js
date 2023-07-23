/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['dist'],
  resolver: 'jest-ts-webcompat-resolver',
  collectCoverageFrom: ['src/**/*.ts'],
  coveragePathIgnorePatterns: [
    'index.ts',
    'app.ts',
    'config.ts',
    'user.ts',
    'post.ts',
    'image.ts',
    'user.router.ts',
    'post.router.ts',
    'http.error.ts',
    'response.api.ts',
    'db.connect.ts',
    'user.mongo.model.ts',
    'post.mongo.model.ts',
    'validation.ts',
  ],
};
