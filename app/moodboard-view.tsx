import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Image, Modal, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { ActivityIndicator, IconButton, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BorderRadius, InkwellColors, Spacing } from '../constants/theme';
import { getMoodboardById, MoodboardImage } from '../services/databaseService';

export default function MoodboardViewScreen() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [images, setImages] = useState<MoodboardImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<MoodboardImage | null>(null);
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    // Keep grid sizing responsive when window dimensions change
    const { width } = useWindowDimensions();
    const imageSize = (width - Spacing.xl) / 2;

    // Load the moodboard data when the screen is focused
    const loadMoodboard = useCallback(async () => {
        try {
            const board = await getMoodboardById(id);
            if (board) {
                setTitle(board.title);
                setImages(board.images ?? []);
                setDescription(board.description ?? '');
            }
        } catch {
            console.error('Failed to load moodboard');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useFocusEffect(
        useCallback(() => {
            loadMoodboard();
        }, [loadMoodboard])
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.centered}>
                <ActivityIndicator />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>

            <View style={styles.header}>
                <IconButton icon="arrow-left" onPress={() => router.back()} />
                <Text variant="titleLarge" numberOfLines={1} style={styles.headerTitle}>
                    {title}
                </Text>
                <IconButton
                    icon="pencil"
                    onPress={() => router.push({ pathname: '/moodboard', params: { id } })}
                />
            </View>

            {description ? (
                <View style={styles.descriptionWrap}>
                    <Text variant="bodyMedium" style={styles.description} numberOfLines={3}>
                        {description}
                    </Text>
                </View>
            ) : null}

            {/* Image grid or empty state */}
            {images.length === 0 ? (
                <View style={styles.centered}>
                    <Text style={styles.empty}>No images yet. Tap the pencil to add some!</Text>
                </View>
            ) : (
                <FlatList
                    data={images}
                    keyExtractor={item => item.id}
                    numColumns={2}
                    contentContainerStyle={styles.gridContent}
                    ListFooterComponent={
                        <Text variant="labelSmall" style={styles.attribution}>
                            Photos provided by Pexels
                        </Text>
                    }
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => setSelectedImage(item)}>
                            <Image
                                source={{ uri: item.url }}
                                style={[styles.gridImage, { width: imageSize, height: imageSize }]}
                                resizeMode="cover"
                            />
                        </TouchableOpacity>
                    )}
                />
            )}

            {/* Full screen image modal, when an image is pressed */}
            <Modal
                visible={!!selectedImage}
                transparent
                animationType="fade"
                onRequestClose={() => setSelectedImage(null)}
            >
                <View style={styles.modalBackdrop}>
                    <TouchableOpacity
                        style={styles.modalClose}
                        onPress={() => setSelectedImage(null)}
                    >
                        <IconButton icon="close" iconColor="white" size={28} />
                    </TouchableOpacity>
                    {selectedImage && (
                        <Image
                            source={{ uri: selectedImage.url }}
                            style={styles.fullImage}
                            resizeMode="contain"
                        />
                    )}
                </View>
            </Modal>
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
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
    },
    descriptionWrap: {
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
    },
    description: {
        color: InkwellColors.onSurfaceVariant,
        opacity: 0.95,
        textAlign: 'center',
    },
    gridContent: {
        alignItems: 'center',
    },
    gridImage: {
        margin: Spacing.xs / 2,
        borderRadius: BorderRadius.sm,
    },
    empty: {
        opacity: 0.6,
        textAlign: 'center',
        paddingHorizontal: Spacing.lg,
    },
    attribution: {
        textAlign: 'center',
        opacity: 0.4,
        marginTop: Spacing.md,
        marginBottom: Spacing.xs,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.92)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalClose: {
        position: 'absolute',
        top: Spacing.md,
        right: Spacing.md,
        zIndex: 1,
    },
    fullImage: {
        width: '95%',
        height: '70%',
    },
});