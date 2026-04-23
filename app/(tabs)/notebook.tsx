import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet } from 'react-native';
import { ActivityIndicator, Card, FAB, IconButton, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { deleteNote, getNotes, Note } from '../../services/databaseService';

export default function NotebookScreen() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
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

    // Confirmation dialog before deleting a note to prevent accidental deletions
    const confirmDelete = (id: string) => {
        Alert.alert('Delete note?', 'This action cannot be undone.', [
            { text: 'Cancel' },
            { text: 'Delete', onPress: () => handleDelete(id) },
        ]);
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text variant="headlineMedium" style={styles.title}>Notebook</Text>
            {loading ? (
                <ActivityIndicator size="large" style={styles.loading} />
            ) : notes.length === 0 ? (
                <Text variant="bodyLarge" style={styles.empty}>
                    No notes yet. Tap + to create one!
                </Text>
            ) : (
                // Render the list of notes using FlatList
                <FlatList
                    data={notes}
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
                                <Text numberOfLines={3} variant="bodyMedium" style={styles.noteContent}>
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    title: {
        marginBottom: 16,
    },
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    empty: {
        flex: 1,
        textAlign: 'center',
        textAlignVertical: 'center',
    },
    card: {
        marginBottom: 12,
    },
    noteTitle: {
        marginBottom: 4,
        fontWeight: '500',
    },
    noteDate: {
        marginBottom: 10,
        opacity: 0.8,
    },
    noteContent: {
        lineHeight: 20,
    },
    cardActions: {
        justifyContent: 'flex-end',
    },
    fab: {
        position: 'absolute',
        right: 16,
        bottom: 16,
    },
});
