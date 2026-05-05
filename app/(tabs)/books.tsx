import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Image, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, Chip, FAB, Searchbar, Text } from 'react-native-paper';
import { SafeAreaView } from "react-native-safe-area-context";
import { BorderRadius, InkwellColors, Spacing } from '../../constants/theme';
import { Book, PreviewFilter, searchBooks, SearchFilter } from '../../services/booksService';

// Google Books can return overlapping volumes between pages; keep first occurrence only.
const dedupeBooksById = (items: Book[]): Book[] => {
    const seen = new Set<string>();
    return items.filter((item) => {
        if (seen.has(item.id)) {
            return false;
        }
        seen.add(item.id);
        return true;
    });
};

export default function BooksScreen() {
    const [query, setQuery] = useState('');
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState('');
    const [searchFilter, setSearchFilter] = useState<SearchFilter>('general');
    const [previewFilter, setPreviewFilter] = useState<PreviewFilter>('all');
    const [searched, setSearched] = useState(false);
    const [startIndex, setStartIndex] = useState(0);
    const [hasMoreResults, setHasMoreResults] = useState(false); // Whether the current search has more results available for pagination. Determined by whether the last search returned a full page of results or not (maxResults is 20, so less than 20 means no more results available).
    const router = useRouter();
    const searchParams = useLocalSearchParams<{
        query?: string;
        searchFilter?: SearchFilter;
        autoSearch?: string;
    }>();
    // Prevent route-driven auto-search from re-running on every re-render.
    const autoSearchHandled = useRef(false);

    // Define the available preview filter options for display in the UI, mapping each PreviewFilter value to a user-friendly label
    const previewFilterOptions: { value: PreviewFilter; label: string }[] = [
        { value: 'all', label: 'Any' },
        { value: 'partial', label: 'Preview available' },
        { value: 'free-ebooks', label: 'Free to read' },
    ];

    const formatPreviewStatus = (book: Book) => {
        if (!book.isPreviewable) {
            return 'No preview pages';
        }

        if (book.isFullyAvailable) {
            return 'Full book available';
        }

        return 'Preview pages available';
    };

    // Function to perform the book search
    const runSearch = useCallback(async (searchQuery: string, searchFilterValue: SearchFilter) => {
        if (!searchQuery.trim()) return;
        setLoading(true);
        setError('');
        setSearched(true);
        setStartIndex(0);
        try {
            const results = await searchBooks(searchQuery, searchFilterValue, previewFilter, 0);
            setBooks(dedupeBooksById(results));
            setHasMoreResults(results.length === 20);
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [previewFilter]);

    // Function to handle the search action when the user submits a query
    const handleSearch = async () => {
        await runSearch(query, searchFilter);
    };

    // Function to load more results by incrementing the startIndex
    const handleLoadMore = async () => {
        if (!query.trim() || loadingMore || !hasMoreResults) return;
        setLoadingMore(true);
        try {
            const nextIndex = startIndex + 20;
            const results = await searchBooks(query, searchFilter, previewFilter, nextIndex);
            if (results.length > 0) {
                setBooks(prev => dedupeBooksById([...prev, ...results]));
                setStartIndex(nextIndex);
            }
            setHasMoreResults(results.length === 20);
        } catch {
            setError('Failed to load more results.');
        } finally {
            setLoadingMore(false);
        }
    };

    // Effect to handle auto-search when the screen is navigated to with a query parameter, but only if autoSearch=1 is set and it hasn't already been handled to prevent re-running on every render.
    useEffect(() => {
        const incomingQuery = typeof searchParams.query === 'string' ? searchParams.query : '';
        const incomingFilter = typeof searchParams.searchFilter === 'string' ? (searchParams.searchFilter as SearchFilter) : undefined;
        const shouldAutoSearch = searchParams.autoSearch === '1';

        if (!shouldAutoSearch || autoSearchHandled.current || !incomingQuery) {
            return;
        }

        autoSearchHandled.current = true;
        setQuery(incomingQuery);
        if (incomingFilter) setSearchFilter(incomingFilter);
        // Reuse the same search flow used by manual searches.
        void runSearch(incomingQuery, incomingFilter ?? 'general');
    }, [runSearch, searchParams.autoSearch, searchParams.query, searchParams.searchFilter]);

    return (
        <SafeAreaView style={styles.container}>

            {/* Header with mirrored logos on each side of the title */}
            <View style={styles.header}>
                <View style={{ width: 40 }} />
                <Image
                    source={require('../../assets/images/inkwell/inkwell-logo-only.png')}
                    style={styles.headerLogoLeft}
                    resizeMode="contain"
                />
                <Text variant="titleLarge">Books</Text>
                <Image
                    source={require('../../assets/images/inkwell/inkwell-logo-only.png')}
                    style={styles.headerLogoRight}
                    resizeMode="contain"
                />
                <View style={{ width: 40 }} />
            </View>

            {/* Search bar for entering book search queries, triggers the search action through icon press or keyboard submit */}
            <Searchbar
                placeholder="Search books..."
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={handleSearch}
                onIconPress={handleSearch}
                style={styles.searchbar}
            />

            <Text variant="labelMedium" style={styles.filterLabel}>Search by</Text>
            {/* Filter chips for selecting the type of search (general, title, author, subject) */}
            <View style={styles.chipRow}>
                {(['general', 'intitle', 'inauthor', 'subject'] as SearchFilter[]).map(f => (
                    <Chip
                        key={f}
                        selected={searchFilter === f}
                        onPress={() => setSearchFilter(f)}
                        style={styles.chip}
                    >
                        {f === 'general' ? 'General' :
                            f === 'intitle' ? 'Title' :
                                f === 'inauthor' ? 'Author' : 'Subject'}
                    </Chip>
                ))}
            </View>


            <Text variant="labelMedium" style={styles.filterLabel}>Preview availability</Text>
            {/* Filter chips for selecting the preview availability of search results */}
            <View style={styles.chipRow}>
                {previewFilterOptions.map((option) => (
                    <Chip
                        key={option.value}
                        selected={previewFilter === option.value}
                        onPress={() => setPreviewFilter(option.value)}
                        style={styles.chip}
                    >
                        {option.label}
                    </Chip>
                ))}
            </View>

            {loading && <ActivityIndicator style={styles.loading} />}
            {error ? <Text style={styles.error}>{error}</Text> : null}

            {/* Empty state text if search succeeds but no books are found */}
            {!loading && searched && books.length === 0 && !error && (
                <Text style={styles.empty}>No books found. Try a different search!</Text>
            )}

            {/* Hint text when no search has been performed */}
            {!loading && !searched && (
                <Text style={styles.hint}>Search for books to get inspired!</Text>
            )}

            {/* List of search results displayed as cards, showing book title, authors, thumbnail, categories, and preview availability. Tapping a card navigates to the book details screen. */}
            <FlatList
                data={books}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.resultsContent}
                renderItem={({ item }) => (
                    <Card
                        style={styles.card}
                        onPress={() => router.push({ pathname: '/book', params: { id: item.id } })}
                    >
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

                                    <View style={styles.badgeRow}>
                                        <Chip compact style={styles.previewBadge} textStyle={styles.previewBadgeText}>
                                            {formatPreviewStatus(item)}
                                        </Chip>
                                    </View>

                                    {/* Display up to 2 category chips for the book */}
                                    {item.categories.length > 0 && (
                                        <View style={styles.categoryRow}>
                                            {item.categories.slice(0, 2).map((category, categoryIndex) => (
                                                // Make key unique by including category index because category labels can repeat within one result.
                                                <Chip key={`${item.id}-${category}-${categoryIndex}`} compact style={styles.categoryChip}>
                                                    {category}
                                                </Chip>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            </View>

                            {item.categories.length > 2 && (
                                <Text variant="bodySmall" style={styles.moreCategories}>
                                    + {item.categories.length - 2} more categories
                                </Text>
                            )}
                        </Card.Content>
                    </Card>
                )}

                // Show a "Load More" button if there are more results available for pagination, or a message indicating no more results if the end has been reached.
                // Only show this footer if a search has been performed and there are results to paginate.
                ListFooterComponent={
                    searched && books.length > 0 ? (
                        <View style={styles.footerContainer}>
                            {hasMoreResults ? (
                                <>
                                    {loadingMore && <ActivityIndicator style={styles.loadingMore} />}
                                    <Button
                                        mode="outlined"
                                        onPress={handleLoadMore}
                                        disabled={loadingMore}
                                        style={styles.loadMoreButton}
                                    >
                                        Load More
                                    </Button>
                                </>
                            ) : (
                                <Text variant="bodySmall" style={styles.noMoreResults}>
                                    No more results for this search.
                                </Text>
                            )}
                        </View>
                    ) : null
                }
            />

            {/* Floating Action Button for accessing favourites */}
            <FAB
                icon="heart"
                label="Favourites"
                onPress={() => router.push('/favourites')}
                style={styles.fab}
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
    headerTitleWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    headerLogoRight: {
        width: 72,
        height: 72,
        transform: [{ scaleX: -1 }], // Flip the logo horizontally for the right side
    },
    headerLogoLeft: {
        width: 72,
        height: 72,
    },
    searchbar: {
        marginTop: Spacing.sm,
        marginBottom: Spacing.md,
    },
    filterLabel: {
        marginBottom: Spacing.sm,
        opacity: 0.6,
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    filterHelp: {
        opacity: 0.65,
        marginBottom: Spacing.sm,
    },
    chip: {
        marginBottom: Spacing.sm,
    },
    loading: {
        marginTop: Spacing.md,
    },
    error: {
        color: InkwellColors.error,
        marginTop: Spacing.sm,
    },
    empty: {
        textAlign: 'center',
        marginTop: Spacing.md,
        opacity: 0.6,
    },
    hint: {
        textAlign: 'center',
        marginTop: Spacing.md,
        opacity: 0.6,
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
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    previewBadge: {
        backgroundColor: InkwellColors.neutral200,
    },
    previewBadgeText: {
        color: InkwellColors.neutral900,
        fontSize: 11,
    },
    categoryRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.xs,
    },
    categoryChip: {
        backgroundColor: InkwellColors.surface,
    },
    moreCategories: {
        opacity: 0.6,
        marginTop: Spacing.sm,
    },
    footerContainer: {
        alignItems: 'center',
        paddingVertical: Spacing.lg,
        gap: Spacing.md,
    },
    loadingMore: {
        marginBottom: Spacing.sm,
    },
    loadMoreButton: {
        width: '100%',
    },
    noMoreResults: {
        opacity: 0.7,
        textAlign: 'center',
    },
    fab: {
        position: 'absolute',
        margin: Spacing.lg,
        right: 0,
        bottom: 0,
        backgroundColor: InkwellColors.secondary,
    },
});