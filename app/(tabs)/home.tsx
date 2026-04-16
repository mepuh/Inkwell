import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Button, Card, IconButton, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import writingQuotesData from "../../assets/data/writingQuotes.json";

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

            {/* Settings button in the top right corner */}
            <IconButton
                icon="cog"
                size={24}
                style={styles.settingButton}
                onPress={() => router.push('/settings')}
            />

            <View style={styles.content}>
                <Text variant="headlineMedium">Home</Text>

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
                        <Button icon="format-quote-close" contentStyle={styles.button} onPress={() => router.push('/quotes')}>
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
    },
    settingButton: {
        alignSelf: 'flex-end',
    },
    content: {
        paddingHorizontal: 16,
        gap: 16,
    },
    author: {
        marginTop: 8,
        fontStyle: 'italic',
    },
    button: {

    },
});