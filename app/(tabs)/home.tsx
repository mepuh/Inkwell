import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Button, Card, IconButton, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import writingQuotesData from "../../assets/data/writingQuotes.json";
import { BorderRadius, InkwellColors, Spacing } from "../../constants/theme";

// Define the structure of a quote object as expected from the local JSON file
type LocalQuote = {
    quote: string;
    author: string;
};

// Cast the imported JSON data to an array of LocalQuote objects
const writingQuotes = writingQuotesData as LocalQuote[];

export default function HomeScreen() {
    const router = useRouter();

    // Select a random quote from the local JSON file to display on the homepage
    const homepageQuote = writingQuotes[Math.floor(Math.random() * writingQuotes.length)];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={{ width: 40 }} />
                <Text variant="titleLarge">Home</Text>
                <IconButton
                    icon="cog"
                    size={24}
                    onPress={() => router.push('/settings')}
                />
            </View>

            <View style={styles.content}>
                <Card>
                    {/* Display a random writing-themed quote */}
                    <Card.Content>
                        <Text variant="bodyLarge">{"\"" + (homepageQuote?.quote ?? "Oops! There should be an inspirational quote here.") + "\""}</Text>
                        {homepageQuote?.author ? (
                            <Text variant="titleMedium" style={styles.author}>- {homepageQuote.author}</Text>
                        ) : null}
                    </Card.Content>

                    {/* Button to navigate to the Quotes screen */}
                    <Card.Actions>
                        <Button icon="format-quote-close" onPress={() => router.push('/quotes')}>
                            Explore Quotes
                        </Button>
                    </Card.Actions>
                </Card>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: InkwellColors.background,
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
        flex: 1,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.lg,
        gap: Spacing.lg,
    },
    card: {
        backgroundColor: InkwellColors.surface,
        borderRadius: BorderRadius.md,
    },
    author: {
        marginTop: Spacing.md,
        fontStyle: 'italic',
        color: InkwellColors.onSurface,
    },
});