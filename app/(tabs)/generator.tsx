import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Card, Dialog, IconButton, Portal, SegmentedButtons, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BorderRadius, InkwellColors, Spacing } from '../../constants/theme';
import { addSavedIdea, deleteSavedIdea, getSavedIdeas, SavedIdea } from '../../services/databaseService';
import {
    CharacterBasic,
    CharacterDetailed,
    CharacterGender,
    CharacterTraits,
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
    StoryInspiration,
    WorldInspiration,
} from '../../services/generatorEngine';

// Type definitions for the character generator mode (basic or detailed) and the character result, which can be either a basic character or a detailed character.
type CharacterMode = 'basic' | 'detailed';
type CharacterResult = CharacterBasic | CharacterDetailed;

// Type guard function to determine if a character result is a detailed character, which allows for safely accessing the additional fields (traits, goal, conflict) that are only present in the detailed character type.
function isDetailedCharacter(character: CharacterResult): character is CharacterDetailed {
    return 'goal' in character && 'conflict' in character;
}

// Type definitions for the payload of a generator snapshot. Each field is optional to allow for saving partial snapshots (e.g., only the character or only the world).
type GeneratorSnapshotPayload = {
    character: CharacterResult | null;
    world: WorldInspiration | null;
    story: StoryInspiration | null;
};

// Type definitions for the scope of a snapshot, determining which parts of the generator output to include.
type SnapshotScope = 'full' | 'character' | 'world' | 'story';

const getSnapshotTitle = (scope: SnapshotScope) => {
    switch (scope) {
        case 'character':
            return 'Character Snapshot';
        case 'world':
            return 'World Snapshot';
        case 'story':
            return 'Story Snapshot';
        default:
            return 'Full Snapshot';
    }
};

// Function to generate user feedback text after saving a snapshot, based on the scope of the snapshot that was saved.
const getSnapshotFeedback = (scope: SnapshotScope) => `${getSnapshotTitle(scope)} saved!`;

// Function to extract the relevant parts of the generator output based on the selected snapshot scope
const getSnapshotPayload = (
    scope: SnapshotScope,
    snapshot: GeneratorSnapshotPayload
): GeneratorSnapshotPayload | null => {
    switch (scope) {
        case 'character':
            return snapshot.character ? { character: snapshot.character, world: null, story: null } : null;
        case 'world':
            return snapshot.world ? { character: null, world: snapshot.world, story: null } : null;
        case 'story':
            return snapshot.story ? { character: null, world: null, story: snapshot.story } : null;
        default:
            if (!snapshot.character && !snapshot.world && !snapshot.story) return null;
            return snapshot;
    }
};

// Function to build a text summary of the snapshot content for display in the saved ideas list and when copying to clipboard, based on the snapshot scope and the actual content of the snapshot.
// This function formats the content in a readable way, grouping character traits together and clearly labeling each section (character, world, story) for easy scanning.
const buildSnapshotSummary = (scope: SnapshotScope, snapshot: GeneratorSnapshotPayload) => {
    const sections: string[] = [];

    const includeCharacter = scope === 'full' || scope === 'character';
    const includeWorld = scope === 'full' || scope === 'world';
    const includeStory = scope === 'full' || scope === 'story';

    if (includeCharacter && snapshot.character) {
        const lines = [
            `${snapshot.character.firstName} ${snapshot.character.lastName}`,
            `Neutral trait: ${snapshot.character.neutralTrait.trait}`,
        ];

        if (isDetailedCharacter(snapshot.character)) {
            lines.push(
                `Positive trait: ${snapshot.character.traits.positive.trait}`,
                `Negative trait: ${snapshot.character.traits.negative.trait}`,
                `Complex trait: ${snapshot.character.traits.complex.trait}`,
                `Goal: ${snapshot.character.goal.goal}`,
                `Conflict: ${snapshot.character.conflict.conflict}`
            );
        }

        sections.push(`Character\nName: ${lines.join('\n')}`);
    }

    if (includeWorld && snapshot.world) {
        sections.push(
            `World\n${snapshot.world.location.name}\n${snapshot.world.location.description}`
        );
    }

    if (includeStory && snapshot.story) {
        sections.push(
            `Story\nPlot twist: ${snapshot.story.plotTwist.twist}\nDialogue: ${snapshot.story.dialoguePrompt.line}`
        );
    }

    return sections.join('\n\n');
};

export default function GeneratorScreen() {
    const [characterMode, setCharacterMode] = useState<CharacterMode>('basic');
    const [characterGender, setCharacterGender] = useState<CharacterGender>('female');
    const [character, setCharacter] = useState<CharacterResult | null>(null);
    const [world, setWorld] = useState<WorldInspiration | null>(null);
    const [story, setStory] = useState<StoryInspiration | null>(null);
    const [savedIdeas, setSavedIdeas] = useState<SavedIdea[]>([]);
    const [showSavedIdeas, setShowSavedIdeas] = useState(false);
    const [savedFeedback, setSavedFeedback] = useState<string | null>(null);
    const [savedIdeaToDelete, setSavedIdeaToDelete] = useState<SavedIdea | null>(null);

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

    // Function to save a generator snapshot to Firebase and refresh the saved ideas list
    const handleSaveSnapshot = async (scope: SnapshotScope) => {
        const snapshot = getSnapshotPayload(scope, {
            character,
            world,
            story,
        });

        if (!snapshot) {
            return;
        }

        const title = getSnapshotTitle(scope);

        try {
            await addSavedIdea({
                title,
                content: buildSnapshotSummary(scope, snapshot),
                payload: JSON.stringify(snapshot),
                savedAt: Date.now(),
            });
            setSavedFeedback(getSnapshotFeedback(scope));
            setTimeout(() => setSavedFeedback(null), 3000);
            if (showSavedIdeas) {
                const updated = await getSavedIdeas();
                setSavedIdeas(updated.sort((a, b) => b.savedAt - a.savedAt));
            }
        } catch {
            console.error('Failed to save idea');
        }
    };

    // Function to load saved ideas from Firebase
    const handleLoadSavedIdeas = async () => {
        if (!showSavedIdeas) {
            try {
                const data = await getSavedIdeas();
                setSavedIdeas(data.sort((a, b) => b.savedAt - a.savedAt));
            } catch {
                console.error('Failed to load saved ideas');
            }
        }
        setShowSavedIdeas(prev => !prev);
    };

    // Function to delete a saved idea from Firebase and update the list
    const handleDeleteSavedIdea = async (id: string) => {
        try {
            await deleteSavedIdea(id);
            setSavedIdeas(prev => prev.filter(idea => idea.id !== id));
        } catch {
            console.error('Failed to delete saved idea');
        }
    };

    // Function to copy the content of a saved idea to the clipboard
    const handleCopySavedIdea = async (idea: SavedIdea) => {
        try {
            await Clipboard.setStringAsync(`${idea.title}\n\n${idea.content}`);
        } catch {
            console.error('Failed to copy saved idea');
        }
    };

    // Function to confirm deletion of a saved idea by setting the state to the idea to be deleted, which will trigger the display of a confirmation dialog
    const confirmDeleteSavedIdea = (idea: SavedIdea) => {
        setSavedIdeaToDelete(idea);
    };

    // Function to cancel the deletion of a saved idea by resetting the state that holds the idea to be deleted, which will close the confirmation dialog
    const cancelDeleteSavedIdea = () => {
        setSavedIdeaToDelete(null);
    };

    // Handler function that is called when the user confirms deletion in the dialog
    const handleConfirmedDeleteSavedIdea = async () => {
        if (!savedIdeaToDelete?.id) return;
        await handleDeleteSavedIdea(savedIdeaToDelete.id);
        setSavedIdeaToDelete(null);
    };

    return (
        <SafeAreaView style={styles.container}>
            
            {/* Header with mirrored logos and title */}
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
                                        <View style={styles.actionButtons}>
                                            <Button mode="outlined" compact onPress={handleRerollFirstName}>Reroll</Button>
                                        </View>
                                    </View>

                                    <View style={styles.fieldRow}>
                                        <View style={styles.fieldTextBlock}>
                                            <Text variant="labelMedium">Last Name</Text>
                                            <Text>{character.lastName}</Text>
                                        </View>
                                        <View style={styles.actionButtons}>
                                            <Button mode="outlined" compact onPress={handleRerollLastName}>Reroll</Button>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.groupCard}>
                                    <Text variant="titleSmall">Personality</Text>
                                    <View style={styles.fieldRow}>
                                        <View style={styles.fieldTextBlock}>
                                            <Text variant="labelMedium">Neutral Trait</Text>
                                            <Text>{character.neutralTrait.trait}</Text>
                                        </View>
                                        <View style={styles.actionButtons}>
                                            <Button mode="outlined" compact onPress={handleRerollNeutralTrait}>Reroll</Button>
                                        </View>
                                    </View>

                                    {isDetailedCharacter(character) ? (
                                        <>
                                            <View style={styles.fieldRow}>
                                                <View style={styles.fieldTextBlock}>
                                                    <Text variant="labelMedium">Positive Trait</Text>
                                                    <Text>{character.traits.positive.trait}</Text>
                                                </View>
                                                <View style={styles.actionButtons}>
                                                    <Button mode="outlined" compact onPress={handleRerollPositiveTrait}>Reroll</Button>
                                                </View>
                                            </View>

                                            <View style={styles.fieldRow}>
                                                <View style={styles.fieldTextBlock}>
                                                    <Text variant="labelMedium">Negative Trait</Text>
                                                    <Text>{character.traits.negative.trait}</Text>
                                                </View>
                                                <View style={styles.actionButtons}>
                                                    <Button mode="outlined" compact onPress={handleRerollNegativeTrait}>Reroll</Button>
                                                </View>
                                            </View>

                                            <View style={styles.fieldRow}>
                                                <View style={styles.fieldTextBlock}>
                                                    <Text variant="labelMedium">Complex Trait</Text>
                                                    <Text>{character.traits.complex.trait}</Text>
                                                </View>
                                                <View style={styles.actionButtons}>
                                                    <Button mode="outlined" compact onPress={handleRerollComplexTrait}>Reroll</Button>
                                                </View>
                                            </View>

                                            <View style={styles.actionButtons}>
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
                                            <View style={styles.actionButtons}>
                                                <Button mode="outlined" compact onPress={handleRerollGoal}>Reroll</Button>
                                            </View>
                                        </View>

                                        <View style={styles.fieldRow}>
                                            <View style={styles.fieldTextBlock}>
                                                <Text variant="labelMedium">Conflict</Text>
                                                <Text>{character.conflict.conflict}</Text>
                                            </View>
                                            <View style={styles.actionButtons}>
                                                <Button mode="outlined" compact onPress={handleRerollConflict}>Reroll</Button>
                                            </View>
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
                                        <View style={styles.actionButtons}>
                                            <Button mode="outlined" compact onPress={handleRerollPlotTwist}>Reroll</Button>
                                        </View>
                                    </View>

                                    <View style={styles.fieldRow}>
                                        <View style={styles.fieldTextBlock}>
                                            <Text variant="labelMedium">Dialogue Prompt</Text>
                                            <Text>{story.dialoguePrompt.line}</Text>
                                        </View>
                                        <View style={styles.actionButtons}>
                                            <Button mode="outlined" compact onPress={handleRerollDialogue}>Reroll</Button>
                                        </View>
                                    </View>
                                </View>
                                <Button mode="contained-tonal" onPress={handleGenerateStory}>Reroll Both</Button>
                            </View>
                        ) : null}
                    </Card.Content>
                </Card>

                {/* Save Snapshots Section */}
                <Card>
                    <Card.Content style={styles.section}>
                        <Text variant="titleLarge">Save Snapshots</Text>
                        <Text variant="bodyMedium" style={styles.introText}>
                            Save the full picture or only the character, world, or story ideas you have generated. Your saved snapshots will appear in the Saved Ideas section below, where you can view, copy, or delete them.
                        </Text>

                        <View style={styles.snapshotButtons}>
                            <Button
                                mode="contained"
                                icon="content-save"
                                onPress={() => handleSaveSnapshot('full')}
                                disabled={!character || !world || !story}
                            >
                                Full Snapshot
                            </Button>
                            <Button
                                mode="outlined"
                                onPress={() => handleSaveSnapshot('character')}
                                disabled={!character}
                            >
                                Character Snapshot
                            </Button>
                            <Button
                                mode="outlined"
                                onPress={() => handleSaveSnapshot('world')}
                                disabled={!world}
                            >
                                World Snapshot
                            </Button>
                            <Button
                                mode="outlined"
                                onPress={() => handleSaveSnapshot('story')}
                                disabled={!story}
                            >
                                Story Snapshot
                            </Button>
                        </View>

                        {savedFeedback && (
                            <Text style={styles.feedback}>{savedFeedback}</Text>
                        )}
                    </Card.Content>
                </Card>

                {/* Saved Ideas Section */}
                <Card>
                    <Card.Content style={styles.section}>
                        <TouchableOpacity onPress={handleLoadSavedIdeas} style={styles.savedIdeasHeader}>
                            <Text variant="titleLarge">Saved Ideas</Text>
                            <IconButton
                                icon={showSavedIdeas ? 'chevron-up' : 'chevron-down'}
                                size={24}
                            />
                        </TouchableOpacity>

                        {showSavedIdeas && (
                            savedIdeas.length === 0 ? (
                                <Text style={styles.empty}>No saved ideas yet.</Text>
                            ) : (
                                <View style={styles.resultBlock}>
                                    {savedIdeas.map(idea => (
                                        <View key={idea.id} style={styles.groupCard}>
                                            <View style={styles.fieldRow}>
                                                <View style={styles.fieldTextBlock}>
                                                    <Text variant="labelLarge">{idea.title}</Text>
                                                    <Text>{idea.content}</Text>
                                                </View>
                                                <View style={styles.actionButtons}>
                                                    <IconButton
                                                        icon="content-copy"
                                                        size={18}
                                                        onPress={() => handleCopySavedIdea(idea)}
                                                    />
                                                    <IconButton
                                                        icon="delete-outline"
                                                        size={20}
                                                        onPress={() => confirmDeleteSavedIdea(idea)}
                                                    />
                                                </View>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )
                        )}
                    </Card.Content>
                </Card>

                {/* Confirmation dialog for deleting a saved idea */}
                <Portal>
                    <Dialog visible={!!savedIdeaToDelete} onDismiss={cancelDeleteSavedIdea}>
                        <Dialog.Title>Delete snapshot?</Dialog.Title>
                        <Dialog.Content>
                            <Text>
                                Are you sure you want to delete this snapshot? This action cannot be undone.
                            </Text>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={cancelDeleteSavedIdea}>Cancel</Button>
                            <Button textColor={InkwellColors.error} onPress={handleConfirmedDeleteSavedIdea}>
                                Delete
                            </Button>
                        </Dialog.Actions>
                    </Dialog>
                </Portal>

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
    snapshotButtons: {
        gap: Spacing.sm,
    },
    feedback: {
        color: 'green',
        textAlign: 'center',
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    savedIdeasHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    empty: {
        textAlign: 'center',
        opacity: 0.6,
        marginBottom: Spacing.md,
    },
});