import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Button, Dialog, IconButton, Portal, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InkwellColors, Spacing } from '../constants/theme';
import { addNote, getNoteById, updateNote } from '../services/databaseService';

export default function NoteScreen() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [createdAt, setCreatedAt] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [initialTitle, setInitialTitle] = useState(''); // Store the initial title to compare for unsaved changes
    const [initialContent, setInitialContent] = useState(''); // Store the initial content to compare for unsaved changes
    const [showDiscardDialog, setShowDiscardDialog] = useState(false);
    const router = useRouter();
    // Determine if there are unsaved changes by comparing the current title and content with their initial values
    const hasUnsavedChanges = title !== initialTitle || content !== initialContent;
    // Get the note ID from the route parameters, which will be used to determine if we are editing an existing note or creating a new one.
    const { id } = useLocalSearchParams<{ id?: string }>();

    // Load the note data when an ID is provided, otherwise we are creating a new note and can leave the fields empty.
    useEffect(() => {
        if (!id) return;

        const loadNote = async () => {
            try {
                const note = await getNoteById(id);
                if (note) {
                    setTitle(note.title);
                    setContent(note.content);
                    setInitialTitle(note.title);
                    setInitialContent(note.content);
                    setCreatedAt(note.createdAt);
                }
            } catch {
                console.error('Failed to load note');
            }
        };

        loadNote();
    }, [id]);

    // Back handler to prompt the user to confirm discarding changes if they have unsaved changes when they attempt to navigate back using the hardware back button (or back gesture) on Android devices
    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            if (hasUnsavedChanges) {
                setShowDiscardDialog(true);
                return true;
            }
            return false;
        });

        return () => backHandler.remove();
    }, [hasUnsavedChanges]);

    // Function to handle the back button press, showing the discard changes dialog if there are unsaved changes or navigating back immediately if there are not
    const handleBackPress = () => {
        if (hasUnsavedChanges) {
            setShowDiscardDialog(true);
            return;
        }
        router.back();
    };

    // Function to discard changes and navigate back, called when the user confirms they want to discard their changes in the dialog
    const discardChanges = () => {
        setShowDiscardDialog(false);
        router.back();
    };

    // Handler function to save a note
    const handleSave = async () => {
        // Prevent saving if both title and content are empty, as this would create an empty note.
        if (!title.trim() && !content.trim()) return;
        setLoading(true);
        const now = Date.now();
        try {
            // If an ID exists, we are updating an existing note; otherwise, we are adding a new note to the database.
            if (id) {
                await updateNote(id, {
                    title: title,
                    content: content,
                    createdAt: createdAt ?? now,
                    updatedAt: now,
                });
            } else {
                await addNote({
                    title: title,
                    content: content,
                    createdAt: now,
                    updatedAt: now,
                });
            }
            // After saving, navigate back to previous screen (Notebook).
            router.back();
        } catch {
            console.error('Failed to save note');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <IconButton icon="arrow-left" onPress={handleBackPress} />
                <Text variant="titleLarge">{id ? 'Edit Note' : 'New Note'}</Text>
                {/* Save cannot be pressed if both title and content are empty, or if the note is currently being saved */}
                <Button onPress={handleSave} loading={loading} disabled={loading || (!title.trim() && !content.trim())}>
                    Save
                </Button>
            </View>
            <KeyboardAwareScrollView
                contentContainerStyle={styles.scrollViewContent}
                keyboardShouldPersistTaps="handled"
                bottomOffset={24}
            >
                <TextInput
                    label="Title"
                    value={title}
                    onChangeText={setTitle}
                    mode="outlined"
                    style={styles.titleInput}
                />
                <TextInput
                    label="Content"
                    value={content}
                    onChangeText={setContent}
                    multiline
                    mode="outlined"
                    style={styles.contentInput}
                />
            </KeyboardAwareScrollView>

            {/* Dialog for confirming discarding changes if the user attempts to navigate back with unsaved changes */}
            <Portal>
                <Dialog visible={showDiscardDialog} onDismiss={() => setShowDiscardDialog(false)}>
                    <Dialog.Title>Discard changes?</Dialog.Title>
                    <Dialog.Content>
                        <Text>You have unsaved changes. If you leave now, they will be lost.</Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setShowDiscardDialog(false)}>Stay</Button>
                        <Button textColor={InkwellColors.error} onPress={discardChanges}>
                            Discard
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
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
        paddingRight: Spacing.sm,
        paddingLeft: Spacing.xs,
        paddingVertical: Spacing.xs,
    },
    scrollViewContent: {
        padding: Spacing.lg,
        paddingBottom: Spacing.xxxl,
        backgroundColor: InkwellColors.surface,
    },
    titleInput: {
        marginBottom: Spacing.md,
    },
    contentInput: {
        minHeight: 300,
    },
});