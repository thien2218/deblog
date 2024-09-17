/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
	preset: "ts-jest",
	testEnvironment: "node",
	testRegex: ".*\\.spec\\.ts$",
	transform: { "^.+\\.(t|j)s$": "ts-jest" },
	moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
	moduleFileExtensions: ["js", "json", "ts"],
	verbose: true,
};
