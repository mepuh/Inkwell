import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { ActivityIndicator, Button, Card, Chip, Divider, IconButton, Text, TextInput } from 'react-native-paper';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BorderRadius, InkwellColors, Spacing } from '../constants/theme';
import { fetchSingleQuote, Quote, quoteCategories, QuoteCategory } from '../services/quotesService';

// A curated list of categories to use for the "Let the Muse pick!" feature, ensuring a good variety of quotes while avoiding some of the more niche or less universally appealing categories (e.g. "death", "fear").
const museCategories: QuoteCategory[] = [
    "wisdom",
    "philosophy",
    "life",
    "truth",
    "inspirational",
    "love",
    "humor",
    "success",
    "courage",
    "happiness",
    "art",
    "writing",
    "time",
    "freedom",
];

export default function QuotesScreen() {
    const router = useRouter();
    const [includedCategories, setIncludedCategories] = useState<QuoteCategory[]>([]);
    const [excludedCategories, setExcludedCategories] = useState<QuoteCategory[]>([]);
    const [author, setAuthor] = useState('');
    const [quote, setQuote] = useState<Quote | null>(null);
    const [quoteSource, setQuoteSource] = useState<'muse' | 'filtered' | null>(null); // Track whether the currently displayed quote is from the muse random pick or from the filtered search to manage where to display it
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false); // Track whether the user has performed a search to determine when to show the "no results" message if no quote is found
    const [copied, setCopied] = useState(false); // Track whether the quote has been copied to the clipboard to provide user feedback

    // Determine if any filters are currently applied to enable or disable the "Find a Match" button
    const hasFilters = includedCategories.length > 0 || excludedCategories.length > 0 || author.trim().length > 0;

    // Toggle functions for including or excluding categories, ensuring that a category cannot be both included and excluded at the same time
    const toggleIncludedCategory = (category: QuoteCategory) => {
        setIncludedCategories((current) => {
            // If the category is already included, remove it; otherwise, add it to the included categories
            if (current.includes(category)) {
                return current.filter((item) => item !== category);
            }
            return [...current, category];
        });

        // Ensure that if a category is being included, it is removed from the excluded categories
        setExcludedCategories((current) => current.filter((item) => item !== category));
    };

    const toggleExcludedCategory = (category: QuoteCategory) => {
        setExcludedCategories((current) => {
            // If the category is already excluded, remove it; otherwise, add it to the excluded categories
            if (current.includes(category)) {
                return current.filter((item) => item !== category);
            }
            return [...current, category];
        });

        // Ensure that if a category is being excluded, it is removed from the included categories
        setIncludedCategories((current) => current.filter((item) => item !== category));
    };

    // Function to fetch a new quote based on the currently applied filters, with error handling and loading state management
    const fetchNewQuote = async () => {
        setQuoteSource('filtered');
        setLoading(true);
        setError(null);
        setHasSearched(true);

        try {
            const quote = await fetchSingleQuote(
                hasFilters
                    ? {
                        categories: includedCategories,
                        excludeCategories: excludedCategories,
                        author,
                    }
                    : {}
            );

            setQuote(quote);
            setQuoteSource('filtered');
        } catch (err) {
            console.error(err);
            setError('Could not fetch quote right now. Please try again.');
            setQuote(null);
            setQuoteSource(null);
        } finally {
            setLoading(false);
        }
    };

    // Function to fetch a random quote from a random category in the museCategories list
    const letTheMusePick = async () => {
        setQuoteSource('muse');
        setLoading(true);
        setError(null);
        setHasSearched(true);

        try {
            const seedCategory = museCategories[Math.floor(Math.random() * museCategories.length)];
            const quote = await fetchSingleQuote({ categories: [seedCategory] });

            setQuote(quote);
            setQuoteSource('muse');
        } catch (err) {
            console.error(err);
            setError('The muse could not fetch a quote right now. Please try again.');
            setQuote(null);
            setQuoteSource(null);
        } finally {
            setLoading(false);
        }
    };

    // Function to clear all filters, allowing the user to start a new search from scratch
    const clearFilters = () => {
        setIncludedCategories([]);
        setExcludedCategories([]);
        setAuthor('');
        setError(null);
        setHasSearched(false);
    };

    // Function to copy the current quote to the clipboard with user feedback
    const handleCopy = async () => {
        if (!quote) return;
        const text = `"${quote.quote}" - ${quote.author}`;
        await Clipboard.setStringAsync(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <IconButton icon="arrow-left" onPress={() => router.back()} />
                <Text variant="titleLarge">Quotes</Text>
                <View style={{ width: 40 }} />
            </View>
            <KeyboardAwareScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                bottomOffset={24}
            >
                <Text variant="bodyMedium" style={styles.introText}>
                    Find a line of inspiration to nudge your story forward. Use a quick spark for a surprise, or narrow the search to a mood, author, or category mix that fits what you are writing.
                </Text>

                {/* Section for the "Let the Muse pick!" feature, allowing users to get a random quote with one click */}
                <View style={styles.sectionWrapper}>
                    <Text variant="titleLarge" style={styles.sectionTitle}>A quick spark</Text>
                    <Text variant="bodyMedium" style={styles.sectionHelp}>
                        Pull one quote from a broad pool of popular categories, perfect for a quick dose of inspiration without any setup.
                    </Text>
                    <Card style={styles.museCard}>
                        <Card.Content>
                            <Text variant="bodyMedium" style={styles.cardText}>
                                One quote, no setup, limitless inspiration, endless possibilities.
                            </Text>
                        </Card.Content>
                        <Card.Actions>
                            <Button mode="contained" onPress={letTheMusePick} disabled={loading}>
                                Let the Muse pick!
                            </Button>
                        </Card.Actions>
                    </Card>
                </View>

                {/*Loading indicator, error message and quote display for the muse pick */}
                {loading && quoteSource === 'muse' && (<ActivityIndicator size="large" style={styles.loading} />)}

                {!loading && error && (
                    <Text style={styles.errorText}>{error}</Text>
                )}

                {!loading && !error && quote && quoteSource === 'muse' && (
                    <Card style={styles.quoteCard}>
                        <Card.Content>
                            <Text variant="bodyLarge">{"\"" + quote.quote + "\""}</Text>
                            <Text variant="titleMedium" style={styles.authorText}>- {quote.author}</Text>
                            {quote.work ? (
                                <Text variant="bodySmall" style={styles.workText}>From the work: {quote.work}</Text>
                            ) : null}
                            <Text variant="bodySmall" style={styles.categoriesText}>
                                Categories: {quote.categories.join(', ')}
                            </Text>
                        </Card.Content>
                        {/* Action button to copy the quote to the clipboard, with user feedback to indicate when the quote has been successfully copied */}
                        <Card.Actions>
                            <Button
                                icon={copied ? 'check' : 'content-copy'}
                                mode="text"
                                onPress={handleCopy}
                            >
                                {copied ? 'Copied' : 'Copy'}
                            </Button>
                        </Card.Actions>
                    </Card>
                )}

                {/* Section for the filtered search, allowing users to apply multiple filters to find a quote that perfectly matches what they are looking for */}
                <View style={styles.sectionWrapper}>
                    <Text variant="titleLarge" style={styles.sectionTitle}>Filtered search</Text>
                    <Text variant="bodyMedium" style={styles.sectionHelp}>
                        Include what you want, exclude what you do not, and optionally narrow it by author.
                    </Text>

                    <Card style={styles.filterCard}>
                        <Card.Content>
                            <Text variant="titleMedium" style={styles.includeTitle}>Include Categories</Text>
                            <Text variant="bodySmall" style={styles.sectionHelp}>
                                Green means go. These are the moods or themes you want the quote to match.
                            </Text>
                            <View style={styles.chipsContainer}>
                                {quoteCategories.map((category) => {
                                    const isSelected = includedCategories.includes(category);

                                    // Categories are displayed as chips that can be toggled on or off to include or exclude them from the search, with visual cues (color and icons) to indicate their current state
                                    return (
                                        <Chip
                                            key={category}
                                            selected={isSelected}
                                            icon={isSelected ? 'check' : 'plus'}
                                            onPress={() => toggleIncludedCategory(category)}
                                            style={[styles.chip, styles.includeChip, isSelected && styles.includeChipSelected]}
                                        >
                                            {category}
                                        </Chip>
                                    );
                                })}
                            </View>

                            <Divider style={styles.divider} />

                            <Text variant="titleMedium" style={styles.excludeTitle}>Exclude Categories</Text>
                            <Text variant="bodySmall" style={styles.sectionHelp}>
                                Red means remove. These categories will be filtered out.
                            </Text>
                            <View style={styles.chipsContainer}>
                                {quoteCategories.map((category) => {
                                    const isSelected = excludedCategories.includes(category);

                                    return (
                                        <Chip
                                            key={`exclude-${category}`}
                                            selected={isSelected}
                                            icon={isSelected ? 'close' : 'minus'}
                                            onPress={() => toggleExcludedCategory(category)}
                                            style={[styles.chip, styles.excludeChip, isSelected && styles.excludeChipSelected]}
                                        >
                                            {category}
                                        </Chip>
                                    );
                                })}
                            </View>

                            <Divider style={styles.divider} />

                            {/* Author filter section with a text input */}
                            <Text variant="bodySmall" style={styles.sectionHelp}>
                                Optionally filter by author name.
                            </Text>

                            <TextInput
                                mode="outlined"
                                label="Author"
                                placeholder="e.g. Shakespeare"
                                value={author}
                                onChangeText={setAuthor}
                                style={styles.authorInput}
                            />
                        </Card.Content>

                        {/* Action buttons for performing the search or clearing the filters, with appropriate enabling/disabling based on the current state (e.g. loading state, whether any filters are applied) */}
                        <Card.Actions style={styles.filterActions}>
                            <Button
                                mode="contained"
                                onPress={fetchNewQuote}
                                disabled={loading || !hasFilters}
                            >
                                Find a Match
                            </Button>
                            <Button mode="text" onPress={clearFilters} disabled={loading}>
                                Clear Filters
                            </Button>
                        </Card.Actions>
                        <Text
                            variant="bodySmall"
                            style={styles.filterHint}
                        >
                            Pick at least one include, exclude, or author filter before searching.
                        </Text>
                    </Card>
                </View>

                {/*Loading indicator, error message, "no results" message and quote display for the filtered search*/}
                {loading && quoteSource !== 'muse' && <ActivityIndicator size="large" style={styles.loading} />}

                {!loading && error && (
                    <Text style={styles.errorText}>{error}</Text>
                )}

                {!loading && !error && !quote && hasSearched && quoteSource === 'filtered' && (
                    <Card style={styles.emptyCard}>
                        <Card.Content>
                            <Text variant="titleMedium" style={styles.emptyTitle}>No quote matched these choices</Text>
                            <Text variant="bodyMedium" style={styles.emptyText}>
                                Try again with fewer filters, remove one of the exclusions, or use a broader author.
                            </Text>
                        </Card.Content>
                    </Card>
                )}

                {!loading && !error && quote && quoteSource === 'filtered' && (
                    <Card style={styles.quoteCard}>
                        <Card.Content>
                            <Text variant="bodyLarge">{"\"" + quote.quote + "\""}</Text>
                            <Text variant="titleMedium" style={styles.authorText}>- {quote.author}</Text>
                            {quote.work ? (
                                <Text variant="bodySmall" style={styles.workText}>From the work: {quote.work}</Text>
                            ) : null}
                            <Text variant="bodySmall" style={styles.categoriesText}>
                                Categories: {quote.categories.join(', ')}
                            </Text>
                        </Card.Content>
                        {/* Action button to copy the quote to the clipboard, with user feedback to indicate when the quote has been successfully copied */}
                        <Card.Actions>
                            <Button
                                icon={copied ? 'check' : 'content-copy'}
                                mode="text"
                                onPress={handleCopy}
                            >
                                {copied ? 'Copied' : 'Copy'}
                            </Button>
                        </Card.Actions>
                    </Card>
                )}
            </KeyboardAwareScrollView>
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
        paddingVertical: Spacing.xs,
    },
    content: {
        padding: Spacing.lg,
        gap: Spacing.lg,
        paddingBottom: Spacing.xxxl,
        backgroundColor: InkwellColors.surface,
    },
    introText: {
        opacity: 0.8,
        marginBottom: Spacing.md,
    },
    cardText: {
        marginTop: Spacing.xs,
        opacity: 0.8,
    },
    sectionWrapper: {
        gap: Spacing.sm,
    },
    sectionTitle: {
        marginTop: Spacing.md,
    },
    sectionHelp: {
        marginBottom: Spacing.md,
        opacity: 0.8,
    },
    museCard: {
        borderLeftWidth: 4,
        borderLeftColor: InkwellColors.secondary,
        backgroundColor: InkwellColors.background,
        borderRadius: BorderRadius.md,
    },
    filterCard: {
        borderLeftWidth: 4,
        borderLeftColor: InkwellColors.primary,
        backgroundColor: InkwellColors.background,
        borderRadius: BorderRadius.md,
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    chip: {
        marginBottom: Spacing.xs,
    },
    includeChip: {
        borderColor: '#B7E4C7',
        backgroundColor: '#F1FBF4',
    },
    includeChipSelected: {
        backgroundColor: '#D9F2E1',
        borderColor: '#2E8B57',
    },
    includeTitle: {
        color: '#2E8B57',
    },
    divider: {
        marginVertical: Spacing.xxxl,
    },
    excludeChip: {
        borderColor: '#F4B4B4',
        backgroundColor: '#FFF5F5',
    },
    excludeChipSelected: {
        backgroundColor: '#FFE3E3',
        borderColor: InkwellColors.error,
    },
    excludeTitle: {
        color: InkwellColors.error,
    },
    authorTitle: {
        color: InkwellColors.onBackground,
    },
    authorInput: {
        marginBottom: Spacing.md,
    },
    filterActions: {
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        marginBottom: Spacing.md,
    },
    filterHint: {
        marginBottom: Spacing.lg,
        marginHorizontal: Spacing.lg,
        opacity: 0.8,
    },
    loading: {
        marginTop: Spacing.xxl,
        marginBottom: Spacing.sm,
    },
    quoteCard: {
        marginTop: Spacing.md,
        marginBottom: Spacing.md,
        backgroundColor: InkwellColors.background,
        borderRadius: BorderRadius.md,
    },
    authorText: {
        marginTop: Spacing.md,
        marginBottom: Spacing.xs,
        fontStyle: 'italic',
    },
    workText: {
        marginTop: Spacing.xs,
    },
    categoriesText: {
        marginTop: Spacing.xs,
    },
    emptyCard: {
        marginTop: Spacing.md,
        marginBottom: Spacing.md,
        borderLeftWidth: 4,
        borderLeftColor: InkwellColors.error,
        backgroundColor: InkwellColors.background,
        borderRadius: BorderRadius.md,
    },
    emptyTitle: {
        marginBottom: Spacing.xs,
    },
    emptyText: {
        opacity: 0.8,
    },
    errorText: {
        color: InkwellColors.error,
    },
});