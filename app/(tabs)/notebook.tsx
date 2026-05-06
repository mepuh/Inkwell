import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Image, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, Dialog, FAB, IconButton, Portal, Searchbar, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BorderRadius, InkwellColors, Spacing } from '../../constants/theme';
import { deleteNote, getNotes, Note } from '../../services/databaseService';

export default function NotebookScreen() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [noteIdToDelete, setNoteIdToDelete] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

    // Function to fetch notes from the database and sort them by updatedAt in descending order (most recent first)
    const fetchNotes = async () => {
        try {
            const data = await getNotes();
            const sorted = data.sort((a, b) => b.updatedAt - a.updatedAt);
            setNotes(sorted);
        } catch (err) {
            console.error('Failed to fetch notes:', err);
        } finally {
            setLoading(false);
        }
    };

    // Function to filter notes based on search query
    const getFilteredNotes = () => {
        if (!searchQuery.trim()) {
            return notes;
        }
        return notes.filter(note =>
            (note.title || 'Untitled').toLowerCase().includes(searchQuery.toLowerCase())
        );
    };

    // Use useFocusEffect to fetch notes whenever the screen comes into focus, ensuring that the list is always up to date when the user navigates back to it
    useFocusEffect(
        useCallback(() => {
            fetchNotes();
        }, [])
    );

    // Handler function to delete a note by its ID
    const handleDelete = async (id: string) => {
        try {
            await deleteNote(id);
            setNotes(prev => prev.filter(note => note.id !== id));
        } catch {
            console.error('Failed to delete note');
        }
    };

    // Function to confirm note deletion by setting the note ID to be deleted, which will trigger the display of a confirmation dialog
    const confirmDelete = (id: string) => {
        setNoteIdToDelete(id);
    };

    // Function to close the delete confirmation dialog and reset the to-be-deleted ID
    const closeDeleteDialog = () => {
        setNoteIdToDelete(null);
    };

    // Handler function that is called when the user confirms deletion in the dialog
    const handleDeleteConfirmed = async () => {
        if (!noteIdToDelete) return;
        await handleDelete(noteIdToDelete);
        closeDeleteDialog();
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
                <Text variant="titleLarge">Notebook</Text>
                <Image
                    source={require('../../assets/images/inkwell/inkwell-logo-only.png')}
                    style={styles.headerLogoRight}
                    resizeMode="contain"
                />
                <View style={{ width: 40 }} />
            </View>

            {/* Search bar - shown when notes exist */}
            {notes.length > 0 && (
                <Searchbar
                    placeholder="Search notes by title..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchbar}
                />
            )}

            {loading ? (
                <ActivityIndicator size="large" style={styles.loader} />
            ) : notes.length === 0 ? (
                <Text style={styles.empty}>No notes yet. Tap + to create one!</Text>
            ) : (
                // Render the list of notes using FlatList
                <FlatList style={styles.list}
                    data={getFilteredNotes()}
                    keyExtractor={item => item.id!}
                    renderItem={({ item }) => (
                        <Card
                            style={styles.card}
                            // Navigate to the note editing screen when a note is tapped, passing the note ID as a route parameter
                            onPress={() => router.push({ pathname: '/note', params: { id: item.id } })}
                        >
                            <Card.Content>
                                <Text variant="titleMedium" style={styles.noteTitle}>
                                    {item.title?.trim() || 'Untitled'}
                                </Text>
                                <Text variant="labelSmall" style={styles.noteDate}>
                                    {new Date(item.updatedAt).toLocaleString()}
                                </Text>
                                <Text numberOfLines={4} variant="bodyMedium" style={styles.noteContent}>
                                    {item.content?.trim() || 'No content'}
                                </Text>
                            </Card.Content>
                            <Card.Actions style={styles.cardActions}>
                                <IconButton
                                    icon="delete-outline"
                                    onPress={() => confirmDelete(item.id!)}
                                />
                            </Card.Actions>
                        </Card>
                    )}
                />
            )}
            <FAB
                icon="plus"
                style={styles.fab}
                onPress={() => router.push('/note')}
            />

            {/* Dialog to confirm note deletion */}
            <Portal>
                <Dialog visible={!!noteIdToDelete} onDismiss={closeDeleteDialog}>
                    <Dialog.Title>Delete note?</Dialog.Title>
                    <Dialog.Content>
                        <Text variant="bodyMedium">This action cannot be undone.</Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={closeDeleteDialog}>Cancel</Button>
                        <Button textColor={InkwellColors.error} onPress={handleDeleteConfirmed}>
                            Delete
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
        paddingHorizontal: Spacing.lg,
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
    loader: {
        marginTop: Spacing.lg,
    },
    empty: {
        textAlign: 'center',
        marginTop: Spacing.lg,
        opacity: 0.6,
    },
    list: {
        padding: Spacing.xs,
    },
    card: {
        marginBottom: Spacing.md,
        borderRadius: BorderRadius.md,
        backgroundColor: InkwellColors.background,
    },
    noteTitle: {
        marginBottom: Spacing.xs,
        color: InkwellColors.onSurface,
    },
    noteDate: {
        marginBottom: Spacing.lg,
        opacity: 0.7,
        color: InkwellColors.onSurfaceVariant,
    },
    noteContent: {
        lineHeight: 18,
        color: InkwellColors.onSurface,
    },
    cardActions: {
        justifyContent: 'flex-end',
    },
    fab: {
        position: 'absolute',
        right: Spacing.lg,
        bottom: Spacing.lg,
    },
    searchbar: {
        marginHorizontal: Spacing.md,
        marginTop: Spacing.xs,
        marginBottom: Spacing.md,
        backgroundColor: InkwellColors.background,
        borderWidth: 1.5,
        borderColor: InkwellColors.surfaceVariant,
    },
});
