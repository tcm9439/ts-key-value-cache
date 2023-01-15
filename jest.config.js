/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    coverageDirectory: "coverage",
    preset: "ts-jest",
    testEnvironment: "node",
    testRegex: "(/test/.*|(\\.|/)(test|spec))\\.(tsx?|jsx?)$",
    modulePathIgnorePatterns: ["<rootDir>/test/util/"],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@test/(.*)$': '<rootDir>/test/$1'
    },
    clearMocks: true,
}
