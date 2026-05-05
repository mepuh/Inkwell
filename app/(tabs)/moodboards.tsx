import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Image, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, Dialog, FAB, IconButton, Portal, Searchbar, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InkwellColors, Spacing } from '../../constants/theme';
import { deleteMoodboard, getMoodboards, Moodboard } from '../../services/databaseService';

export default function MoodboardsScreen() {
    const [moodboards, setMoodboards] = useState<Moodboard[]>([]);
    const [loading, setLoading] = useState(true);
    const [moodboardIdToDelete, setMoodboardIdToDelete] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

    // Function to fetch all moodboards for the current user and update the state, sorted by most recently updated first
    const fetchMoodboards = async () => {
        try {
            const data = await getMoodboards();
            setMoodboards(data.sort((a, b) => b.updatedAt - a.updatedAt));
        } catch {
            console.error('Failed to fetch moodboards');
        } finally {
            setLoading(false);
        }
    };

    // Function to filter moodboards based on search query
    const getFilteredMoodboards = () => {
        if (!searchQuery.trim()) {
            return moodboards;
        }

        return moodboards.filter(board =>
            (board.title || 'Untitled').toLowerCase().includes(searchQuery.toLowerCase())
        );
    };

    // Use useFocusEffect to fetch moodboards whenever the screen comes into focus, ensuring the list is up to date
    useFocusEffect(
        useCallback(() => {
            fetchMoodboards();
        }, [])
    );

    // Function to handle deleting a moodboard by its ID, updating the state to remove it from the list after deletion
    const handleDelete = async (id: string) => {
        try {
            await deleteMoodboard(id);
            setMoodboards(prev => prev.filter(board => board.id !== id));
        } catch {
            console.error('Failed to delete moodboard');
        }
    };

    // Function to set the ID of the moodboard to be deleted, which triggers the confirmation dialog to open
    const confirmDelete = (id: string) => {
        setMoodboardIdToDelete(id);
    };

    // Function to close the delete confirmation dialog by clearing the ID of the moodboard to be deleted
    const closeDeleteDialog = () => {
        setMoodboardIdToDelete(null);
    };

    // Handler function that is called when the user confirms deletion in the dialog
    const handleDeleteConfirmed = async () => {
        if (!moodboardIdToDelete) return;
        await handleDelete(moodboardIdToDelete);
        closeDeleteDialog();
    };

    // Function to render a mosaic preview of the moodboard images based on how many images it contains, with different layouts for 0, 1, 2, 3, or 4+ images
    const renderMosaicPreview = (images?: Moodboard['images']) => {
        const previewImages = images ?? [];
        const count = previewImages.length;

        if (count === 0) {
            return (
                <View style={styles.mosaicEmpty}>
                    <Text style={styles.mosaicEmptyText}>No images yet</Text>
                </View>
            );
        }

        if (count === 1) {
            return (
                <Image
                    source={{ uri: previewImages[0].url }}
                    style={styles.previewImageSingle}
                    resizeMode="cover"
                />
            );
        }

        if (count === 2) {
            return (
                <View style={styles.previewRow}>
                    {previewImages.slice(0, 2).map(image => (
                        <Image
                            key={image.id}
                            source={{ uri: image.url }}
                            style={styles.previewImageHalf}
                            resizeMode="cover"
                        />
                    ))}
                </View>
            );
        }

        if (count === 3) {
            return (
                <View style={styles.previewRow}>
                    <Image
                        source={{ uri: previewImages[0].url }}
                        style={styles.previewImageLarge}
                        resizeMode="cover"
                    />
                    <View style={styles.previewColumn}>
                        {previewImages.slice(1, 3).map(image => (
                            <Image
                                key={image.id}
                                source={{ uri: image.url }}
                                style={styles.previewImageStacked}
                                resizeMode="cover"
                            />
                        ))}
                    </View>
                </View>
            );
        }

        return (
            <View style={styles.previewGrid}>
                {previewImages.slice(0, 4).map(image => (
                    <Image
                        key={image.id}
                        source={{ uri: image.url }}
                        style={styles.previewImageQuarter}
                        resizeMode="cover"
                    />
                ))}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>

            {/* Header with mirrored logos and title */}
            <View style={styles.header}>
                <View style={{ width: 40 }} />
                <Image
                    source={require('../../assets/images/inkwell/inkwell-logo-only.png')}
                    style={styles.headerLogoLeft}
                    resizeMode="contain"
                />
                <Text variant="titleLarge">Moodboards</Text>
                <Image
                    source={require('../../assets/images/inkwell/inkwell-logo-only.png')}
                    style={styles.headerLogoRight}
                    resizeMode="contain"
                />
                <View style={{ width: 40 }} />
            </View>

            {/* Search bar - shown when moodboards exist */}
            {moodboards.length > 0 && (
                <Searchbar
                    placeholder="Search moodboards by title..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchbar}
                />
            )}

            {loading ? (
                <ActivityIndicator style={styles.loader} />
            ) : moodboards.length === 0 ? (
                <Text style={styles.empty}>No moodboards yet. Tap + to create one!</Text>
            ) : (
                // Render a FlatList of moodboards
                <FlatList
                    keyExtractor={item => item.id!}
                    numColumns={2}
                    data={getFilteredMoodboards()}
                    columnWrapperStyle={styles.columnWrapper}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => (
                        <Card
                            style={styles.card}
                            // Navigate to the moodboard editing screen when the card is pressed, passing the moodboard ID as a route parameter
                            onPress={() => router.push({ pathname: '/moodboard', params: { id: item.id } })}
                        >
                            {/* Render the mosaic preview of the moodboard images at the top of the card */}
                            <View style={styles.mosaicWrapper}>{renderMosaicPreview(item.images)}</View>

                            <Card.Content style={styles.cardContentRow}>
                                <View style={styles.cardText}>
                                    <Text variant="titleMedium" numberOfLines={1} style={styles.cardTitle}>
                                        {item.title || 'Untitled'}
                                    </Text>
                                    <Text variant="labelSmall" style={styles.cardSubtitle}>
                                        {`${item.images?.length ?? 0} image${(item.images?.length ?? 0) !== 1 ? 's' : ''} · ${new Date(item.updatedAt).toLocaleDateString()}`}
                                    </Text>
                                </View>
                                <IconButton icon="delete-outline" onPress={() => confirmDelete(item.id!)} />
                            </Card.Content>
                        </Card>
                    )}
                />
            )}

            {/* Floating action button to create a new moodboard, navigating to the moodboard editing screen without an ID (indicating a new moodboard) when pressed */}
            <FAB icon="plus" style={styles.fab} onPress={() => router.push('/moodboard')} />

            {/* Dialog for confirming deletion of a moodboard */}
            <Portal>
                <Dialog visible={!!moodboardIdToDelete} onDismiss={closeDeleteDialog}>
                    <Dialog.Title>Delete moodboard?</Dialog.Title>
                    <Dialog.Content>
                        <Text>This action cannot be undone.</Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={closeDeleteDialog}>Cancel</Button>
                        <Button textColor={InkwellColors.error} onPress={handleDeleteConfirmed}>
                            Delete
                        </Button>
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
        paddingHorizontal: Spacing.lg,
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
    loader: {
        marginTop: Spacing.lg,
    },
    empty: {
        textAlign: 'center',
        marginTop: Spacing.lg,
        opacity: 0.6,
    },
    listContent: {
        paddingBottom: Spacing.lg,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        marginBottom: Spacing.lg,
    },
    card: {
        width: '48%',
        marginBottom: 0,
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 2,
        backgroundColor: InkwellColors.background,
    },
    mosaicWrapper: {
        backgroundColor: InkwellColors.onSurfaceVariant + '08',
    },
    mosaicEmpty: {
        height: 120,
        backgroundColor: InkwellColors.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mosaicEmptyText: {
        color: InkwellColors.onSurfaceVariant,
        opacity: 0.7,
    },
    previewRow: {
        flexDirection: 'row',
        width: '100%',
        height: 120,
    },
    previewColumn: {
        flex: 1,
        height: 120,
    },
    previewGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: '100%',
        height: 120,
    },
    previewImageSingle: {
        width: '100%',
        height: 120,
    },
    previewImageHalf: {
        width: '50%',
        height: 120,
    },
    previewImageLarge: {
        width: '60%',
        height: 120,
    },
    previewImageStacked: {
        width: '100%',
        height: 60,
    },
    previewImageQuarter: {
        width: '50%',
        height: 60,
    },
    cardContentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.md,
    },
    cardText: {
        flex: 1,
        paddingRight: Spacing.xs,
    },
    cardTitle: {
        color: InkwellColors.onSurface,
    },
    cardSubtitle: {
        color: InkwellColors.onSurfaceVariant,
    },
    fab: {
        position: 'absolute',
        right: 16,
        bottom: 16,
    },
     searchbar: {
        marginHorizontal: Spacing.md,
        marginTop: Spacing.xs,
        marginBottom: Spacing.md,
        backgroundColor: InkwellColors.background,
        borderWidth: 1.5,
        borderColor: InkwellColors.surfaceVariant,
    },
});