import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Image, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Card, IconButton, Searchbar, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BorderRadius, InkwellColors, Spacing } from '../constants/theme';
import { FavouriteBook, getFavouriteBooks, removeFavouriteBook } from '../services/databaseService';

export default function FavouritesScreen() {
    const [books, setBooks] = useState<FavouriteBook[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showControls, setShowControls] = useState(false);
    const [sortBy, setSortBy] = useState<'title' | 'date'>('title');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
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

    // Filter and sort favourite books using the search query and sort options selected by the user
    const filteredBooks = books
        .filter(book => (book.title || '').toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
            if (sortBy === 'date') {
                return sortOrder === 'asc' ? a.savedAt - b.savedAt : b.savedAt - a.savedAt;
            }

            const titleA = (a.title || '').toLowerCase();
            const titleB = (b.title || '').toLowerCase();
            const comparison = titleA.localeCompare(titleB);
            return sortOrder === 'asc' ? comparison : -comparison;
        });

    return (
        <SafeAreaView style={styles.container}>
    
            <View style={styles.header}>
                <View style={styles.headerSide}>
                    <IconButton icon="arrow-left" onPress={() => router.back()} />
                </View>
                <Text variant="titleLarge" style={styles.headerTitle}>Favourites</Text>
                <View style={styles.headerSide}>
                    {books.length > 0 && (
                        <IconButton
                            icon={showControls ? 'close' : 'tune'}
                            onPress={() => setShowControls(prev => !prev)}
                        />
                    )}
                </View>
            </View>

            {/* Show search and sort controls only when there are books to display and the user has toggled them open */}
            {!loading && books.length > 0 && showControls && (
                <View style={styles.controlsPanel}>
                    <Searchbar
                        placeholder="Search favourite books..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        style={styles.searchbar}
                    />

                    <View style={styles.sortRow}>
                        <IconButton
                            icon="sort-alphabetical-ascending"
                            size={20}
                            iconColor={sortBy === 'title' && sortOrder === 'asc' ? InkwellColors.primary : InkwellColors.onSurfaceVariant}
                            style={[
                                styles.sortButton,
                                sortBy === 'title' && sortOrder === 'asc' && styles.sortButtonActive,
                            ]}
                            onPress={() => {
                                setSortBy('title');
                                setSortOrder('asc');
                            }}
                        />
                        <IconButton
                            icon="sort-alphabetical-descending"
                            size={20}
                            iconColor={sortBy === 'title' && sortOrder === 'desc' ? InkwellColors.primary : InkwellColors.onSurfaceVariant}
                            style={[
                                styles.sortButton,
                                sortBy === 'title' && sortOrder === 'desc' && styles.sortButtonActive,
                            ]}
                            onPress={() => {
                                setSortBy('title');
                                setSortOrder('desc');
                            }}
                        />
                        <IconButton
                            icon="sort-calendar-ascending"
                            size={20}
                            iconColor={sortBy === 'date' && sortOrder === 'asc' ? InkwellColors.primary : InkwellColors.onSurfaceVariant}
                            style={[
                                styles.sortButton,
                                sortBy === 'date' && sortOrder === 'asc' && styles.sortButtonActive,
                            ]}
                            onPress={() => {
                                setSortBy('date');
                                setSortOrder('asc');
                            }}
                        />
                        <IconButton
                            icon="sort-calendar-descending"
                            size={20}
                            iconColor={sortBy === 'date' && sortOrder === 'desc' ? InkwellColors.primary : InkwellColors.onSurfaceVariant}
                            style={[
                                styles.sortButton,
                                sortBy === 'date' && sortOrder === 'desc' && styles.sortButtonActive,
                            ]}
                            onPress={() => {
                                setSortBy('date');
                                setSortOrder('desc');
                            }}
                        />
                    </View>
                </View>
            )}

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
                data={filteredBooks}
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
                                    <Text variant="labelSmall" style={styles.savedDate}>
                                        Favourite since {new Date(item.savedAt).toLocaleDateString('en-GB', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                        })}
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
        paddingHorizontal: Spacing.md,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: Spacing.xs,
        paddingRight: Spacing.xs,
        paddingVertical: Spacing.md,
    },
    headerSide: {
        width: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
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
    savedDate: {
        opacity: 0.65,
        marginBottom: Spacing.sm,
        color: InkwellColors.onSurfaceVariant,
    },
    actionRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginTop: Spacing.sm,
    },
    actionButton: {
        margin: 0,
    },
    controlsPanel: {
        marginBottom: Spacing.xs,
    },
    searchbar: {
        marginTop: Spacing.sm,
        marginBottom: Spacing.sm,
        backgroundColor: InkwellColors.background,
        borderWidth: 1.5,
        borderColor: InkwellColors.surfaceVariant,
    },
    sortRow: {
        flexDirection: 'row',
        alignSelf: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.xs,
    },
    sortButton: {
        margin: 0,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    sortButtonActive: {
        borderColor: InkwellColors.primary,
        backgroundColor: InkwellColors.neutral200,
    },
});
