import {
	adjectives,
	animals,
	type Config,
	colors,
	uniqueNamesGenerator,
} from "unique-names-generator";

// Username generator utility using unique-names-generator
// Generates usernames in the format: AdjectiveAnimal123

const config: Config = {
	dictionaries: [adjectives, colors, animals],
	separator: "",
	length: 2,
	style: "capital",
};

export function generateUsername(): string {
	// Generate base username
	const baseName = uniqueNamesGenerator(config);

	// Add 3-digit number for extra uniqueness
	const number = Math.floor(Math.random() * 900) + 100; // 100-999

	return `${baseName}${number}`;
}
