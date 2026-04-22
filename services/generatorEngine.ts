import characterGoalsData from '../assets/data/characterGoals.json';
import conflictsData from '../assets/data/conflicts.json';
import dialoguePromptsData from '../assets/data/dialoguePrompts.json';
import firstNamesData from '../assets/data/firstNames.json';
import lastNamesData from '../assets/data/lastNames.json';
import locationsData from '../assets/data/locations.json';
import personalityTraitsData from '../assets/data/personalityTraits.json';
import plotTwistsData from '../assets/data/plotTwists.json';

// Define the structure of the data types used in the generator
export type TraitType = 'positive' | 'negative' | 'complex' | 'neutral';
export type CharacterGender = 'female' | 'male';

export type Name = {
	name: string;
	gender?: 'female' | 'male' | 'unisex';
};

export type Trait = {
	trait: string;
	type: TraitType;
};

export type Goal = {
	goal: string;
	type: string;
	tags?: string[];
};

export type Conflict = {
	conflict: string;
	type: 'internal' | 'external';
};

export type Location = {
	name: string;
	description: string;
	tags: string[];
};

export type PlotTwist = {
	twist: string;
	tags: string[];
};

export type DialoguePrompt = {
	line: string;
	tags: string[];
};

// Define the structures for the generated content
// Character traits include positive, negative, and complex traits (when generating detailed characters)
export type CharacterTraits = {
	positive: Trait;
	negative: Trait;
	complex: Trait;
};

// Basic character information includes first name, last name, and a neutral trait
export type CharacterBasic = {
	firstName: string;
	lastName: string;
	neutralTrait: Trait;
};

// Detailed character information includes all basic info plus additional traits, a goal, and a conflict
export type CharacterDetailed = CharacterBasic & {
	traits: CharacterTraits;
	goal: Goal;
	conflict: Conflict;
};

// World inspiration includes a location with its description and tags (tags can be used in future versions for more intelligent generation or filtering)
export type WorldInspiration = {
	location: Location;
};

// Story inspiration includes a plot twist and a dialogue prompt, both with associated tags (tags can be used in future versions for more intelligent generation or filtering)
export type StoryInspiration = {
	plotTwist: PlotTwist;
	dialoguePrompt: DialoguePrompt;
};

// Cast the imported JSON data to their respective types for use in the generator functions
const firstNames = firstNamesData as Name[];
const lastNames = lastNamesData as Name[];
const traits = personalityTraitsData as Trait[];
const goals = characterGoalsData as Goal[];
const conflicts = conflictsData as Conflict[];
const locations = locationsData as Location[];
const plotTwists = plotTwistsData as PlotTwist[];
const dialoguePrompts = dialoguePromptsData as DialoguePrompt[];

// Utility function to select a random item from an array, used by all generator functions
export const getRandom = <T,>(items: T[]): T => {
	return items[Math.floor(Math.random() * items.length)];
};

// Generator functions for each type of content, utilizing the getRandom utility to select random entries from the respective data arrays

// Generate a random first name based on the specified gender
export const generateFirstName = (gender: CharacterGender): string => {
	// Filter the first names to include only those that match the specified gender or are unisex
	const matchingNames = firstNames.filter(
		(name) => name.gender === gender || name.gender === 'unisex'
	);
	// If there are matching names, return a random one from that filtered list; otherwise, return a random name from the entire list as a fallback
	if (matchingNames.length > 0) {
		return getRandom(matchingNames).name;
	}

	return getRandom(firstNames).name;
};

// Generate a random last name from the list of last names
export const generateLastName = (): string => getRandom(lastNames).name;

// Generate a random goal from the list of character goals
export const generateGoal = (): Goal => getRandom(goals);

// Generate a random conflict from the list of conflicts
export const generateConflict = (): Conflict => getRandom(conflicts);

// Generate a random location from the list of locations
export const generateLocation = (): Location => getRandom(locations);

// Generate a random plot twist from the list of plot twists
export const generatePlotTwist = (): PlotTwist => getRandom(plotTwists);

// Generate a random dialogue prompt from the list of dialogue prompts
export const generateDialoguePrompt = (): DialoguePrompt => getRandom(dialoguePrompts);

// Generate a random neutral trait from the list of traits, filtering for those that are specifically marked as 'neutral'.
// If no neutral traits are found (which should not happen if the data is properly structured), it falls back to selecting a random trait from the entire list.
export const generateNeutralTrait = (): Trait => {
	const neutralTraits = traits.filter((item) => item.type === 'neutral');

	if (neutralTraits.length > 0) {
		return getRandom(neutralTraits);
	}

	return getRandom(traits);
};

// Generate a random trait of a specified type (positive, negative, or complex), with an optional list of trait names to exclude from the selection.
// This allows for ensuring that the same trait is not selected multiple times when generating a set of traits for a character (shouldn't happen if the data is properly structured, but works as a safety net if traits are accidentally duplicated or tagged incorrectly).
// If the exclusion list results in no available traits of the specified type, it falls back to selecting from all traits of that type without exclusions.
export const generateTraitByType = (
	type: Exclude<TraitType, 'neutral'>,
	excludedTraitNames: string[] = []
): Trait => {
	const pool = traits.filter(
		(item) => item.type === type && !excludedTraitNames.includes(item.trait)
	);

	if (pool.length > 0) {
		return getRandom(pool);
	}

	// Fallback in case exclusion removed all options
	return getRandom(traits.filter((item) => item.type === type));
};

// Main generator functions that combine the individual pieces of data to create more complex structures for characters, world inspiration, and story inspiration

// Generate a set of character traits, ensuring that the positive, negative, and complex traits are all different from each other by using the generateTraitByType function
export const generateCharacterTraits = (): CharacterTraits => {
	const positive = generateTraitByType('positive');
	const negative = generateTraitByType('negative', [positive.trait]);
	const complex = generateTraitByType('complex', [positive.trait, negative.trait]);

	return {
		positive,
		negative,
		complex,
	};
};

// Generate a basic character with a first name, last name, and a neutral trait
export const generateCharacterBasic = (gender: CharacterGender): CharacterBasic => {
	return {
		firstName: generateFirstName(gender),
		lastName: generateLastName(),
		neutralTrait: generateNeutralTrait(),
	};
};

// Generate a detailed character that includes all the basic information plus additional traits, a goal, and a conflict
export const generateCharacterDetailed = (gender: CharacterGender): CharacterDetailed => {
	const base = generateCharacterBasic(gender);

	return {
		...base,
		traits: generateCharacterTraits(),
		goal: generateGoal(),
		conflict: generateConflict(),
	};
};

// Generate world inspiration by selecting a random location from the list of locations
export const generateWorldInspiration = (): WorldInspiration => {
	return {
		location: generateLocation(),
	};
};

// Generate story inspiration by selecting a random plot twist and a random dialogue prompt from their respective lists
export const generateStoryInspiration = (): StoryInspiration => {
	return {
		plotTwist: generatePlotTwist(),
		dialoguePrompt: generateDialoguePrompt(),
	};
};
