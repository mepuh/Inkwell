import { useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, SegmentedButtons, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BorderRadius, InkwellColors, Spacing } from '../../constants/theme';
import {
    CharacterBasic,
    CharacterDetailed,
    CharacterGender,
    CharacterTraits,
    StoryInspiration,
    WorldInspiration,
    generateCharacterBasic,
    generateCharacterDetailed,
    generateConflict,
    generateDialoguePrompt,
    generateFirstName,
    generateGoal,
    generateLastName,
    generateLocation,
    generateNeutralTrait,
    generatePlotTwist,
    generateStoryInspiration,
    generateTraitByType,
    generateWorldInspiration,
} from '../../services/generatorEngine';

// Type definitions for the character generator mode (basic or detailed) and the character result, which can be either a basic character or a detailed character.
type CharacterMode = 'basic' | 'detailed';
type CharacterResult = CharacterBasic | CharacterDetailed;

// Type guard function to determine if a character result is a detailed character, which allows for safely accessing the additional fields (traits, goal, conflict) that are only present in the detailed character type.
function isDetailedCharacter(character: CharacterResult): character is CharacterDetailed {
    return 'goal' in character && 'conflict' in character;
}

export default function GeneratorScreen() {
    const [characterMode, setCharacterMode] = useState<CharacterMode>('basic');
    const [characterGender, setCharacterGender] = useState<CharacterGender>('female');
    const [character, setCharacter] = useState<CharacterResult | null>(null);
    const [world, setWorld] = useState<WorldInspiration | null>(null);
    const [story, setStory] = useState<StoryInspiration | null>(null);

    // Helper function to regenerate all traits
    const regenerateTraits = (currentTraits: CharacterTraits): CharacterTraits => {
        // Try up to 10 times to reroll each slot so every trait changes from its previous value.
        for (let attempt = 0; attempt < 10; attempt += 1) {
            const positive = generateTraitByType('positive', [currentTraits.positive.trait]);
            const negative = generateTraitByType('negative', [currentTraits.negative.trait, positive.trait]);
            const complex = generateTraitByType('complex', [currentTraits.complex.trait, positive.trait, negative.trait]);

            // If all traits are different from the current ones, return the new set. Otherwise, try again.
            if (
                positive.trait !== currentTraits.positive.trait &&
                negative.trait !== currentTraits.negative.trait &&
                complex.trait !== currentTraits.complex.trait
            ) {
                return { positive, negative, complex };
            }
        }

        // Fallback for tiny data pools: still keep the categories distinct from each other but allow possible duplicates to previous values.
        const positive = generateTraitByType('positive');
        const negative = generateTraitByType('negative', [positive.trait]);
        const complex = generateTraitByType('complex', [positive.trait, negative.trait]);
        return { positive, negative, complex };
    };

    // Helper function to build a detailed character from a basic character by generating new traits, a goal, and a conflict. This is used when expanding a basic character to a detailed character to keep the existing identity fields (first name, last name, neutral trait).
    const buildDetailedCharacter = (baseCharacter: CharacterBasic): CharacterDetailed => {
        return {
            ...baseCharacter,
            traits: regenerateTraits({
                positive: generateTraitByType('positive'),
                negative: generateTraitByType('negative'),
                complex: generateTraitByType('complex'),
            }),
            goal: generateGoal(),
            conflict: generateConflict(),
        };
    };

    // Handles expansion of a basic character to a detailed character.
    const handleExpandToDetailed = () => {
        setCharacterMode('detailed');

        setCharacter((prev) => {
            if (!prev || isDetailedCharacter(prev)) return prev;
            return buildDetailedCharacter(prev);
        });
    };

    // Handler functions for generating and rerolling characters, world inspiration, and story inspiration. Each field has its own reroll handler that only changes that specific field, while the main generate handler creates a completely new set of data for the entire character/world/story.

    const handleGenerateCharacter = () => {
        if (characterMode === 'basic') {
            setCharacter(generateCharacterBasic(characterGender));
            return;
        }

        setCharacter(generateCharacterDetailed(characterGender));
    };

    const handleRerollFirstName = () => {
        setCharacter((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                firstName: generateFirstName(characterGender),
            };
        });
    };

    const handleRerollLastName = () => {
        setCharacter((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                lastName: generateLastName(),
            };
        });
    };

    const handleRerollPositiveTrait = () => {
        setCharacter((prev) => {
            if (!prev || !isDetailedCharacter(prev)) return prev;
            return {
                ...prev,
                traits: {
                    ...prev.traits,
                    positive: generateTraitByType('positive', [prev.traits.negative.trait, prev.traits.complex.trait]),
                },
            };
        });
    };

    const handleRerollNegativeTrait = () => {
        setCharacter((prev) => {
            if (!prev || !isDetailedCharacter(prev)) return prev;
            return {
                ...prev,
                traits: {
                    ...prev.traits,
                    negative: generateTraitByType('negative', [prev.traits.positive.trait, prev.traits.complex.trait]),
                },
            };
        });
    };

    const handleRerollComplexTrait = () => {
        setCharacter((prev) => {
            if (!prev || !isDetailedCharacter(prev)) return prev;
            return {
                ...prev,
                traits: {
                    ...prev.traits,
                    complex: generateTraitByType('complex', [prev.traits.positive.trait, prev.traits.negative.trait]),
                },
            };
        });
    };

    const handleRerollNeutralTrait = () => {
        setCharacter((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                neutralTrait: generateNeutralTrait(),
            };
        });
    };

    const handleRerollAllTraits = () => {
        setCharacter((prev) => {
            if (!prev || !isDetailedCharacter(prev)) return prev;
            return {
                ...prev,
                neutralTrait: generateNeutralTrait(),
                traits: regenerateTraits(prev.traits),
            };
        });
    };

    const handleRerollGoal = () => {
        setCharacter((prev) => {
            if (!prev || !isDetailedCharacter(prev)) return prev;
            return {
                ...prev,
                goal: generateGoal(),
            };
        });
    };

    const handleRerollConflict = () => {
        setCharacter((prev) => {
            if (!prev || !isDetailedCharacter(prev)) return prev;
            return {
                ...prev,
                conflict: generateConflict(),
            };
        });
    };

    const handleGenerateWorld = () => {
        setWorld(generateWorldInspiration());
    };

    const handleRerollLocation = () => {
        setWorld((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                location: generateLocation(),
            };
        });
    };

    const handleGenerateStory = () => {
        setStory(generateStoryInspiration());
    };

    const handleRerollPlotTwist = () => {
        setStory((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                plotTwist: generatePlotTwist(),
            };
        });
    };

    const handleRerollDialogue = () => {
        setStory((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                dialoguePrompt: generateDialoguePrompt(),
            };
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={{ width: 40 }} />
                <Image
                    source={require('../../assets/images/inkwell/inkwell-logo-only.png')}
                    style={styles.headerLogoLeft}
                    resizeMode="contain"
                />
                <Text variant="titleLarge">Generator</Text>
                <Image
                    source={require('../../assets/images/inkwell/inkwell-logo-only.png')}
                    style={styles.headerLogoRight}
                    resizeMode="contain"
                />
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Character Generator */}
                <Card>
                    <Card.Content style={styles.section}>
                        <Text variant="titleLarge">Character Generator</Text>

                        <Text variant="bodyMedium" style={styles.introText}>
                            Build a character from the ground up, or add depth to an existing character by exploring traits, goals, and conflicts.
                        </Text>

                        <SegmentedButtons
                            value={characterMode}
                            onValueChange={(value) => setCharacterMode(value as CharacterMode)}
                            buttons={[
                                { value: 'basic', label: 'Basic' },
                                { value: 'detailed', label: 'Detailed' },
                            ]}
                        />

                        <SegmentedButtons
                            value={characterGender}
                            onValueChange={(value) => setCharacterGender(value as CharacterGender)}
                            buttons={[
                                { value: 'female', label: 'Female' },
                                { value: 'male', label: 'Male' },
                            ]}
                        />

                        <Button mode="contained" onPress={handleGenerateCharacter}>
                            Generate Character
                        </Button>

                        {/* Show generated character */}
                        {character ? (
                            <View style={styles.resultBlock}>
                                <View style={styles.groupCard}>
                                    <Text variant="titleSmall">Identity</Text>
                                    <View style={styles.fieldRow}>
                                        <View style={styles.fieldTextBlock}>
                                            <Text variant="labelMedium">First Name</Text>
                                            <Text>{character.firstName}</Text>
                                        </View>
                                        <Button mode="outlined" compact onPress={handleRerollFirstName}>Reroll</Button>
                                    </View>

                                    <View style={styles.fieldRow}>
                                        <View style={styles.fieldTextBlock}>
                                            <Text variant="labelMedium">Last Name</Text>
                                            <Text>{character.lastName}</Text>
                                        </View>
                                        <Button mode="outlined" compact onPress={handleRerollLastName}>Reroll</Button>
                                    </View>
                                </View>

                                <View style={styles.groupCard}>
                                    <Text variant="titleSmall">Personality</Text>
                                    <View style={styles.fieldRow}>
                                        <View style={styles.fieldTextBlock}>
                                            <Text variant="labelMedium">Neutral Trait</Text>
                                            <Text>{character.neutralTrait.trait}</Text>
                                        </View>
                                        <Button mode="outlined" compact onPress={handleRerollNeutralTrait}>Reroll</Button>
                                    </View>

                                    {isDetailedCharacter(character) ? (
                                        <>
                                            <View style={styles.fieldRow}>
                                                <View style={styles.fieldTextBlock}>
                                                    <Text variant="labelMedium">Positive Trait</Text>
                                                    <Text>{character.traits.positive.trait}</Text>
                                                </View>
                                                <Button mode="outlined" compact onPress={handleRerollPositiveTrait}>Reroll</Button>
                                            </View>

                                            <View style={styles.fieldRow}>
                                                <View style={styles.fieldTextBlock}>
                                                    <Text variant="labelMedium">Negative Trait</Text>
                                                    <Text>{character.traits.negative.trait}</Text>
                                                </View>
                                                <Button mode="outlined" compact onPress={handleRerollNegativeTrait}>Reroll</Button>
                                            </View>

                                            <View style={styles.fieldRow}>
                                                <View style={styles.fieldTextBlock}>
                                                    <Text variant="labelMedium">Complex Trait</Text>
                                                    <Text>{character.traits.complex.trait}</Text>
                                                </View>
                                                <Button mode="outlined" compact onPress={handleRerollComplexTrait}>Reroll</Button>
                                            </View>

                                            <View style={styles.buttonRow}>
                                                <Button mode="outlined" compact onPress={handleRerollAllTraits}>Reroll All Traits</Button>
                                            </View>
                                        </>
                                    ) : null}
                                </View>

                                {/* Story Drive (goal and conflict), only shown for detailed characters */}
                                {isDetailedCharacter(character) ? (
                                    <View style={styles.groupCard}>
                                        <Text variant="titleSmall">Story Drive</Text>
                                        <View style={styles.fieldRow}>
                                            <View style={styles.fieldTextBlock}>
                                                <Text variant="labelMedium">Goal</Text>
                                                <Text>{character.goal.goal}</Text>
                                            </View>
                                            <Button mode="outlined" compact onPress={handleRerollGoal}>Reroll</Button>
                                        </View>

                                        <View style={styles.fieldRow}>
                                            <View style={styles.fieldTextBlock}>
                                                <Text variant="labelMedium">Conflict</Text>
                                                <Text>{character.conflict.conflict}</Text>
                                            </View>
                                            <Button mode="outlined" compact onPress={handleRerollConflict}>Reroll</Button>
                                        </View>
                                    </View>
                                ) : null}

                                {/* If the character is currently in basic mode, show a button to expand to detailed mode. If the character is already in detailed mode, this button is hidden since the character is already fully expanded. */}
                                {!isDetailedCharacter(character) ? (
                                    <Button mode="contained-tonal" onPress={handleExpandToDetailed}>
                                        Expand to Detailed View
                                    </Button>
                                ) : null}

                                <Button mode="contained-tonal" onPress={handleGenerateCharacter}>Reroll All Character Fields</Button>
                            </View>
                        ) : null}
                    </Card.Content>
                </Card>

                {/* World Generator */}
                <Card>
                    <Card.Content style={styles.section}>
                        <Text variant="titleLarge">World Generator</Text>

                        <Text variant="bodyMedium" style={styles.introText}>
                            Generate a setting to delve into.
                        </Text>

                        <Button mode="contained" onPress={handleGenerateWorld}>
                            Generate Setting
                        </Button>

                        {/* Show generated setting */}
                        {world ? (
                            <View style={styles.resultBlock}>
                                <View style={styles.groupCard}>
                                    <View style={styles.fieldRow}>
                                        <View style={styles.fieldTextBlock}>
                                            <Text variant="titleMedium">{world.location.name}</Text>
                                            <Text>{world.location.description}</Text>
                                        </View>
                                        <Button mode="outlined" compact onPress={handleRerollLocation}>Reroll</Button>
                                    </View>
                                </View>
                            </View>
                        ) : null}
                    </Card.Content>
                </Card>

                {/* Story Generator */}
                <Card>
                    <Card.Content style={styles.section}>
                        <Text variant="titleLarge">Story Generator</Text>

                        <Text variant="bodyMedium" style={styles.introText}>
                            Get instant plot momentum with a plot twist and a line of dialogue.
                        </Text>

                        <Button mode="contained" onPress={handleGenerateStory}>
                            Generate Story Inspiration
                        </Button>

                        {/* Show generated story inspiration */}
                        {story ? (
                            <View style={styles.resultBlock}>
                                <View style={styles.groupCard}>
                                    <View style={styles.fieldRow}>
                                        <View style={styles.fieldTextBlock}>
                                            <Text variant="labelMedium">Plot Twist</Text>
                                            <Text>{story.plotTwist.twist}</Text>
                                        </View>
                                        <Button mode="outlined" compact onPress={handleRerollPlotTwist}>Reroll</Button>
                                    </View>

                                    <View style={styles.fieldRow}>
                                        <View style={styles.fieldTextBlock}>
                                            <Text variant="labelMedium">Dialogue Prompt</Text>
                                            <Text>{story.dialoguePrompt.line}</Text>
                                        </View>
                                        <Button mode="outlined" compact onPress={handleRerollDialogue}>Reroll</Button>
                                    </View>
                                </View>
                                <Button mode="contained-tonal" onPress={handleGenerateStory}>Reroll Both</Button>
                            </View>
                        ) : null}
                    </Card.Content>
                </Card>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: InkwellColors.surface,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: Spacing.xs,
        paddingRight: Spacing.xs,
        paddingVertical: Spacing.md,
    },
    headerLogoRight: {
        width: 72,
        height: 72,
        transform: [{ scaleX: -1 }],
    },
    headerLogoLeft: {
        width: 72,
        height: 72,
    },
    content: {
        padding: Spacing.lg,
        gap: Spacing.lg,
        backgroundColor: InkwellColors.surface,
    },
    section: {
        gap: Spacing.md,
    },
    introText: {
        opacity: 0.8,
    },
    resultBlock: {
        gap: Spacing.md,
        marginTop: Spacing.sm,
    },
    groupCard: {
        backgroundColor: InkwellColors.background,
        borderColor: InkwellColors.secondary,
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        gap: Spacing.md,
    },
    fieldRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: Spacing.md,
    },
    fieldTextBlock: {
        flex: 1,
        gap: Spacing.xs,
    },
    buttonRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
});