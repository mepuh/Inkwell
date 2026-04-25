import { Image, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from "react-native-safe-area-context";
import { InkwellColors, Spacing } from '../../constants/theme';

export default function MoodboardScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={{ width: 40 }} />
                <Image
                    source={require('../../assets/images/inkwell/inkwell-logo-only.png')}
                    style={styles.headerLogoLeft}
                    resizeMode="contain"
                />
                <Text variant="titleLarge">Moodboard</Text>
                <Image
                    source={require('../../assets/images/inkwell/inkwell-logo-only.png')}
                    style={styles.headerLogoRight}
                    resizeMode="contain"
                />
                <View style={{ width: 40 }} />
            </View>
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
        paddingVertical: Spacing.md,
    },
    headerLogoRight: {
        width: 72,
        height: 72,
        transform: [{ scaleX: -1 }],
    },
    headerLogoLeft: {
        width: 72,
        height: 72,
    },
});