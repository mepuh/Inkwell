import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, IconButton } from "react-native-paper";
import { useRouter } from "expo-router";

export default function HomeScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            <IconButton
                icon="cog"
                size={24}
                style={styles.settingButton}
                onPress={() => router.push('/settings')}
            />
            <Text>Home</Text>
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
});