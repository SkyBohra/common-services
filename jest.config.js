module.exports = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: '.',
    testRegex: '.*\\.spec\\.ts$',
    testPathIgnorePatterns: ['/node_modules/'],
    transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
    },
    collectCoverageFrom: [
        'src/**/*.(t|j)s',
        '!src/**/*.interface.ts',
        '!src/index.ts',
    ],
    coverageDirectory: 'coverage',
    testEnvironment: 'node',
    moduleNameMapper: {
        '^src/(.*)$': '<rootDir>/src/$1',
    },
};