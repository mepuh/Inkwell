import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, IconButton, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addNote, getNoteById, updateNote } from '../services/databaseService';

export default function NoteScreen() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [createdAt, setCreatedAt] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
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
                    setCreatedAt(note.createdAt);
                }
            } catch {
                console.error('Failed to load note');
            }
        };

        loadNote();
    }, [id]);

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
                <IconButton icon="arrow-left" onPress={() => router.back()} />
                <Text variant="titleLarge">{id ? 'Edit Note' : 'New Note'}</Text>
                <Button onPress={handleSave} loading={loading} disabled={loading}>
                    Save
                </Button>
            </View>
            <ScrollView style={styles.scrollView}>
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
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingRight: 8,
    },
    scrollView: {
        flex: 1,
        padding: 16,
    },
    titleInput: {
        marginBottom: 12,
    },
    contentInput: {
        minHeight: 300,
    },
});