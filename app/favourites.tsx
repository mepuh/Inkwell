import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Image, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Card, IconButton, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BorderRadius, InkwellColors, Spacing } from '../constants/theme';
import { FavouriteBook, getFavouriteBooks, removeFavouriteBook } from '../services/databaseService';

export default function FavouritesScreen() {
    const [books, setBooks] = useState<FavouriteBook[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const router = useRouter();

    // Fetch favourite books whenever the screen comes into focus
    const fetchFavourites = useCallback(async () => {
        try {
            setLoading(true);
            const favourites = await getFavouriteBooks();
            // Sort by savedAt in descending order (most recent first)
            const sorted = favourites.sort((a, b) => b.savedAt - a.savedAt);
            setBooks(sorted);
            setError('');
        } catch (err) {
            setError('Failed to load favourite books.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchFavourites();
        }, [fetchFavourites])
    );

    // Handler for removing a book from favourites, which calls the database function and updates local state to immediately reflect the change in the UI without needing to refetch the entire list
    const handleRemoveFavourite = async (id: string) => {
        try {
            await removeFavouriteBook(id);
            // Update local state immediately so the card disappears without full refetch
            setBooks(prev => prev.filter(book => book.id !== id));
        } catch (err) {
            console.error('Failed to remove favourite:', err);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header with back button and title */}
            <View style={styles.header}>
                <IconButton icon="arrow-left" onPress={() => router.back()} />
                <Text variant="titleLarge">Favourites</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading && <ActivityIndicator style={styles.loading} />}
            {error ? <Text style={styles.error}>{error}</Text> : null}

            {/* Empty state when no favourites */}
            {!loading && books.length === 0 && !error && (
                <View style={styles.emptyContainer}>
                    <Text variant="titleMedium" style={styles.emptyTitle}>No favourite books yet</Text>
                    <Text variant="bodyMedium" style={styles.emptyText}>
                        Save books from your search to see them here.
                    </Text>
                </View>
            )}

            {/* List of favourite books */}
            <FlatList
                data={books}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.resultsContent}
                renderItem={({ item }) => (
                    <Card style={styles.card}>
                        <Card.Content>
                            <View style={styles.cardRow}>
                                {item.thumbnail ? (
                                    <Image
                                        source={{ uri: item.thumbnail }}
                                        style={styles.thumbnail}
                                    />
                                ) : (
                                    <View style={styles.thumbnailPlaceholder}>
                                        <Text variant="labelSmall" style={styles.placeholderText}>No cover</Text>
                                    </View>
                                )}

                                <View style={styles.cardMain}>
                                    <Text variant="titleMedium" numberOfLines={2} style={styles.bookTitle}>
                                        {item.title}
                                    </Text>
                                    <Text variant="bodySmall" numberOfLines={2} style={styles.bookAuthors}>
                                        {item.authors.join(', ')}
                                    </Text>

                                    <View style={styles.actionRow}>
                                        {/* Button to open the book details screen, passing the book ID as a route parameter. */}
                                        <IconButton
                                            icon="book-open"
                                            size={20}
                                            onPress={() => router.push({ pathname: '/book', params: { id: item.id } })}
                                            style={styles.actionButton}
                                        />
                                        <IconButton
                                            icon="heart"
                                            size={20}
                                            iconColor={InkwellColors.error}
                                            onPress={() => handleRemoveFavourite(item.id)}
                                            style={styles.actionButton}
                                        />
                                    </View>
                                </View>
                            </View>
                        </Card.Content>
                    </Card>
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: InkwellColors.surface,
        padding: Spacing.md,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: Spacing.xs,
        paddingRight: Spacing.xs,
        paddingVertical: Spacing.md,
    },
    loading: {
        marginTop: Spacing.md,
    },
    error: {
        color: InkwellColors.error,
        marginTop: Spacing.sm,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: Spacing.md,
    },
    emptyTitle: {
        textAlign: 'center',
    },
    emptyText: {
        textAlign: 'center',
        opacity: 0.7,
        maxWidth: '80%',
    },
    resultsContent: {
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.xxxl,
    },
    card: {
        marginBottom: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: InkwellColors.surfaceVariant,
        backgroundColor: InkwellColors.neutral100,
        overflow: 'hidden',
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.md,
    },
    cardMain: {
        flex: 1,
    },
    thumbnail: {
        width: 78,
        height: 116,
        borderRadius: BorderRadius.sm,
        backgroundColor: InkwellColors.surfaceVariant,
    },
    thumbnailPlaceholder: {
        width: 78,
        height: 116,
        borderRadius: BorderRadius.sm,
        backgroundColor: InkwellColors.surfaceVariant,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Spacing.xs,
    },
    placeholderText: {
        opacity: 0.7,
        textAlign: 'center',
    },
    bookTitle: {
        marginBottom: Spacing.xs,
    },
    bookAuthors: {
        opacity: 0.7,
        marginBottom: Spacing.sm,
    },
    actionRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginTop: Spacing.sm,
    },
    actionButton: {
        margin: 0,
    },
});
