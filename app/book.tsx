import { useLocalSearchParams, useRouter } from 'expo-router';
import { openBrowserAsync } from 'expo-web-browser';
import { useCallback, useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { ActivityIndicator, Button, Chip, Dialog, Divider, IconButton, Portal, Text } from 'react-native-paper';
import RenderHTML from 'react-native-render-html';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BorderRadius, InkwellColors, Spacing } from '../constants/theme';
import { Book, getBookById } from '../services/booksService';
import {
    addFavouriteBook,
    isBookFavourited,
    removeFavouriteBook,
} from '../services/databaseService';

export default function BookScreen() {
    const [book, setBook] = useState<Book | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFavourited, setIsFavourited] = useState(false);
    const [error, setError] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedAuthor, setSelectedAuthor] = useState('');
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { width } = useWindowDimensions();

    // Function to load book details and check if it's favourited when the component mounts or when the book ID changes
    const loadBook = useCallback(async () => {
        try {
            const [bookData, favourited] = await Promise.all([
                getBookById(id),
                isBookFavourited(id),
            ]);
            setBook(bookData);
            setIsFavourited(favourited);
        } catch {
            setError('Failed to load book. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) {
            loadBook();
        }
    }, [id, loadBook]);

    // Function to handle adding or removing the book from favourites when the favourite button is pressed
    const handleFavourite = async () => {
        if (!book) return;
        try {
            if (isFavourited) {
                await removeFavouriteBook(book.id);
                setIsFavourited(false);
            } else {
                await addFavouriteBook({
                    id: book.id,
                    title: book.title,
                    authors: book.authors,
                    thumbnail: book.thumbnail,
                    savedAt: Date.now(),
                });
                setIsFavourited(true);
            }
        } catch {
            console.error('Failed to update favourite status');
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.centered}>
                <ActivityIndicator />
            </SafeAreaView>
        );
    }

    // Display an error message if there was an issue loading the book details, along with a button to go back to the previous screen
    if (error || !book) {
        return (
            <SafeAreaView style={styles.centered}>
                <Text>{error || 'Error in loading book details.'}</Text>
                <Button onPress={() => router.back()}>Go back</Button>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>

            <View style={styles.header}>
                <IconButton icon="arrow-left" onPress={() => router.back()} />
                <IconButton
                    icon={isFavourited ? 'heart' : 'heart-outline'}
                    onPress={handleFavourite}
                />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {book.thumbnail ? (
                    <Image source={{ uri: book.thumbnail }} style={styles.cover} />
                ) : null}

                <Text variant="headlineSmall" style={styles.title}>{book.title}</Text>
                <View style={styles.authorRow}>
                    {book.authors.map((author, i) => (
                        <Text
                            key={i}
                            variant="bodyMedium"
                            // Author names can be pressed to open the author-search dialog
                            onPress={() => setSelectedAuthor(author)}
                            style={styles.authorText}
                        >
                            {author}{i < book.authors.length - 1 ? ', ' : ''}
                        </Text>
                    ))}
                </View>

                <View style={styles.meta}>
                    {book.publishedDate ? (
                        <Text variant="bodySmall">{book.publishedDate.slice(0, 4)}</Text> // Show only the year for simplicity, as many books have incomplete date info
                    ) : null}
                    {book.pageCount > 0 ? (
                        <Text variant="bodySmall">{book.pageCount} pages</Text>
                    ) : null}
                    {book.averageRating > 0 ? (
                        <Text variant="bodySmall">⭐ {book.averageRating} ({book.ratingsCount})</Text>
                    ) : null}
                </View>

                {book.categories.length > 0 && (
                    <View style={styles.chipRow}>
                        {book.categories.map((category, index) => (
                            <Chip
                                key={index}
                                style={styles.chip}
                                // Category chips can be pressed to open the category-search dialog (or simply see full category name if doesn't fit in the chip)
                                onPress={() => setSelectedCategory(category)}
                            >
                                {category}
                            </Chip>
                        ))}
                    </View>
                )}

                <Divider style={styles.divider} />

                {book.description ? (
                    <>
                        <Text variant="titleMedium" style={styles.sectionTitle}>About this book</Text>
                        <View>
                            {/* Use RenderHTML to display the book description, which may contain HTML formatting */}
                            <RenderHTML
                                // Keep HTML width in sync with card padding to prevent clipped content
                                contentWidth={Math.max(320, width - Spacing.md * 2)}
                                source={{ html: book.description }}
                                // Custom styles for HTML tags in the description to ensure proper spacing and formatting
                                tagsStyles={{
                                    p: { marginBottom: Spacing.sm },
                                    em: { fontStyle: 'italic' },
                                    strong: { fontWeight: '600' },
                                }}
                            />
                        </View>
                        <Divider style={styles.divider} />
                    </>
                ) : null}

                {/* Show action buttons for opening more info in the browser, depending on the availability of these links in the book data */}
                <View style={styles.buttons}>
                    {book.isPreviewable && !book.isFullyAvailable && book.previewLink ? (
                        <Button
                            mode="contained"
                            icon="book-open"
                            onPress={() => openBrowserAsync(book.previewLink)}
                            style={styles.button}
                        >
                            Open Preview Pages
                        </Button>
                    ) : null}

                    {book.isFullyAvailable && book.previewLink ? (
                        <Button
                            mode="contained"
                            icon="book-open"
                            onPress={() => openBrowserAsync(book.previewLink)}
                            style={styles.button}
                        >
                            Open Book
                        </Button>
                    ) : null}

                    {book.infoLink ? (
                        <Button
                            mode="outlined"
                            icon="information"
                            onPress={() => openBrowserAsync(book.infoLink)}
                            style={styles.button}
                        >
                            More Info
                        </Button>
                    ) : null}
                </View>
            </ScrollView>

            {/* Dialogs for category and author, offering to search for more books in the same category or by the same author when pressed.
            The dialog content is dynamically set based on which chip was pressed, and the search is triggered by navigating to the Books screen with appropriate query parameters when the user confirms. */}
            <Portal>
                <Dialog visible={Boolean(selectedCategory)} onDismiss={() => setSelectedCategory('')}>
                    <Dialog.Title>{selectedCategory}</Dialog.Title>
                    <Dialog.Content>
                        <Text>Search for more books in this category?</Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button
                            onPress={() => {
                                const category = selectedCategory;
                                setSelectedCategory('');
                                // Pre-fill Books screen and trigger one-shot category search via route params.
                                router.push(`/books?query=${encodeURIComponent(category)}&searchFilter=subject&autoSearch=1`);
                            }}
                            disabled={!selectedCategory}
                        >
                            Search this category
                        </Button>
                        <Button onPress={() => setSelectedCategory('')}>Close</Button>
                    </Dialog.Actions>
                </Dialog>

                <Dialog visible={Boolean(selectedAuthor)} onDismiss={() => setSelectedAuthor('')}>
                    <Dialog.Title>{selectedAuthor}</Dialog.Title>
                    <Dialog.Content>
                        <Text>Search for more works by this author?</Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button
                            onPress={() => {
                                const author = selectedAuthor;
                                setSelectedAuthor('');
                                // Pre-fill Books screen and trigger one-shot author search via route params.
                                router.push(`/books?query=${encodeURIComponent(author)}&searchFilter=inauthor&autoSearch=1`);
                            }}
                            disabled={!selectedAuthor}
                        >
                            Search this author
                        </Button>
                        <Button onPress={() => setSelectedAuthor('')}>Close</Button>
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
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: Spacing.md,
        backgroundColor: InkwellColors.surface,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    content: {
        padding: Spacing.md,
        gap: Spacing.md,
    },
    cover: {
        width: 120,
        height: 180,
        borderRadius: BorderRadius.sm,
        alignSelf: 'center',
        marginBottom: Spacing.md,
    },
    title: {
        textAlign: 'center',
    },
    authors: {
        textAlign: 'center',
        opacity: 0.7,
    },
    meta: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: Spacing.md,
        opacity: 0.6,
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: Spacing.sm,
    },
    chip: {
        marginBottom: Spacing.xs,
        alignSelf: 'center',
    },
    authorRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: Spacing.sm,
    },
    authorText: {
        marginBottom: Spacing.xs,
        alignSelf: 'center',
        color: InkwellColors.primary,
    },
    divider: {
        marginVertical: Spacing.md,
    },
    sectionTitle: {
        marginBottom: Spacing.sm,
    },
    description: {
        lineHeight: 22,
        opacity: 0.8,
    },
    buttons: {
        gap: Spacing.sm,
        marginTop: Spacing.sm,
    },
    button: {
        width: '100%',
    },
});