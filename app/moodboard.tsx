import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { BackHandler, Dimensions, FlatList, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Button, Dialog, IconButton, Portal, Searchbar, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BorderRadius, InkwellColors, Spacing } from '../constants/theme';
import {
    addMoodboard,
    getMoodboards,
    Moodboard,
    MoodboardImage,
    updateMoodboard,
} from '../services/databaseService';
import { getCuratedImages, PexelsImage, searchImages } from '../services/imagesService';

// Calculate image size for a 3-column grid based on screen width and desired spacing
const SCREEN_WIDTH = Dimensions.get('window').width;
const IMAGE_SIZE = (SCREEN_WIDTH - 48) / 3;

// Utility function to ensure uniqueness of images by their ID, used to prevent duplicate images in the search results when merging new results with existing ones
const uniqueImagesById = (images: PexelsImage[]) => {
    return Array.from(new Map(images.map(image => [String(image.id), image])).values());
};

export default function MoodboardScreen() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedImages, setSelectedImages] = useState<MoodboardImage[]>([]);
    const [initialTitle, setInitialTitle] = useState(''); // Store the initial title to compare for unsaved changes
    const [initialDescription, setInitialDescription] = useState(''); // Store the initial description to compare for unsaved changes
    const [initialSelectedImages, setInitialSelectedImages] = useState<MoodboardImage[]>([]); // Store the initial selected images to compare for unsaved changes
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<PexelsImage[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [showDiscardDialog, setShowDiscardDialog] = useState(false);
    const [page, setPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(false);
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id?: string }>();
    // Determine if there are unsaved changes by comparing the current title, description, and selected images with their initial values, using a stringified version of the selected images for comparison since they are arrays of objects
    const selectedImagesKey = selectedImages.map(image => `${image.id}|${image.url}|${image.photographer ?? ''}|${image.alt ?? ''}`).join('||');
    const initialSelectedImagesKey = initialSelectedImages
        .map(image => `${image.id}|${image.url}|${image.photographer ?? ''}|${image.alt ?? ''}`)
        .join('||');
    const hasUnsavedChanges = title !== initialTitle || description !== initialDescription || selectedImagesKey !== initialSelectedImagesKey;

    // Function to load initial data when the component mounts, including fetching the moodboard to edit (if an ID is provided) and fetching curated images to display as initial search results
    const loadInitial = useCallback(async () => {
        try {
            if (id) {
                const boards = await getMoodboards();
                const board = boards.find(b => b.id === id);
                if (board) {
                    setTitle(board.title);
                    setSelectedImages(board.images ?? []);
                    setDescription(board.description ?? '');
                    setInitialTitle(board.title);
                    setInitialDescription(board.description ?? '');
                    setInitialSelectedImages(board.images ?? []);
                }
            }
            const curated = await getCuratedImages(1, 21);
            setSearchResults(uniqueImagesById(curated.images));
            setHasNextPage(!!curated.nextPage);
        } catch {
            console.error('Failed to load moodboard or images');
        } finally {
            setInitialLoading(false);
        }
    }, [id]);

    // Back handler to prompt the user to confirm discarding changes if they have unsaved changes when they attempt to navigate back using the hardware back button (or back gesture) on Android devices
    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            if (hasUnsavedChanges) {
                setShowDiscardDialog(true);
                return true;
            }
            return false;
        });

        return () => backHandler.remove();
    }, [hasUnsavedChanges]);

    // Function to handle the back button press, showing the discard changes dialog if there are unsaved changes or navigating back immediately if there are not
    const handleBackPress = () => {
        if (hasUnsavedChanges) {
            setShowDiscardDialog(true);
            return;
        }
        router.back();
    };

    // Function to discard changes and navigate back, called when the user confirms they want to discard their changes in the dialog
    const discardChanges = () => {
        setShowDiscardDialog(false);
        router.back();
    };

    useEffect(() => {
        loadInitial();
    }, [loadInitial]);

    // Function to handle searching for images based on the search query, updating the search results and pagination state accordingly
    const handleSearch = async (resetPage = true) => {
        if (!searchQuery.trim()) return;
        setLoading(true);
        const currentPage = resetPage ? 1 : page;
        try {
            const results = await searchImages(searchQuery, {
                page: currentPage,
                perPage: 21,
            });
            if (resetPage) {
                setSearchResults(uniqueImagesById(results.images));
                setPage(1);
            } else {
                setSearchResults(prev => uniqueImagesById([...prev, ...results.images]));
            }
            setHasNextPage(!!results.nextPage);
        } catch {
            console.error('Failed to search images');
        } finally {
            setLoading(false);
        }
    };

    // Function to load more images when the user scrolls to the end of the list, using the next page of results based on the current search query and pagination state
    const handleLoadMore = async () => {
        if (!hasNextPage || loading) return;
        const nextPage = page + 1;
        setPage(nextPage);
        setLoading(true);
        try {
            const results = searchQuery.trim()
                ? await searchImages(searchQuery, { page: nextPage, perPage: 21 })
                : await getCuratedImages(nextPage, 21);
            setSearchResults(prev => uniqueImagesById([...prev, ...results.images]));
            setHasNextPage(!!results.nextPage);
        } catch {
            console.error('Failed to load more images');
        } finally {
            setLoading(false);
        }
    };

    // Function to toggle the selection of an image, adding it to the selected images if it's not already selected or removing it if it is
    const toggleImage = (image: PexelsImage) => {
        const exists = selectedImages.find(img => img.id === String(image.id));
        if (exists) {
            setSelectedImages(prev => prev.filter(img => img.id !== String(image.id)));
        } else {
            setSelectedImages(prev => [
                ...prev,
                {
                    id: String(image.id),
                    url: image.src.medium,
                    photographer: image.photographer,
                    alt: image.alt,
                },
            ]);
        }
    };

    // Function to handle saving the moodboard, either by creating a new moodboard in the database or updating an existing one based on whether an ID is provided, and then navigating back to the previous screen
    const handleSave = async () => {
        if (!title.trim()) return;
        setSaving(true);
        const now = Date.now();
        const moodboardData: Omit<Moodboard, 'id'> = {
            title: title.trim(),
            description: description.trim(),
            images: selectedImages ?? [],
            createdAt: now,
            updatedAt: now,
        };
        try {
            if (id) {
                await updateMoodboard(id, moodboardData);
            } else {
                await addMoodboard(moodboardData);
            }
            router.back();
        } catch {
            console.error('Failed to save moodboard');
        } finally {
            setSaving(false);
        }
    };

    if (initialLoading) {
        return (
            <SafeAreaView style={styles.centered}>
                <ActivityIndicator />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <IconButton icon="arrow-left" onPress={handleBackPress} />
                <Text variant="titleLarge">{id ? 'Edit Moodboard' : 'New Moodboard'}</Text>
                {/* Save cannot be pressed if the title is empty or the moodboard is being saved */}
                <Button onPress={handleSave} loading={saving} disabled={saving || !title.trim()}>
                    Save
                </Button>
            </View>

            <TextInput
                label="Moodboard title"
                mode="outlined"
                value={title}
                onChangeText={setTitle}
                style={styles.titleInput}
            />

            <TextInput
                label="Description (optional)"
                mode="outlined"
                value={description}
                onChangeText={setDescription}
                style={styles.descriptionInput}
                multiline
                numberOfLines={3}
            />

            {/* If there are selected images, display them in a horizontal list at the top, allowing the user to see which images they have selected and remove them if desired */}
            {selectedImages.length > 0 && (
                <View style={styles.selectedSection}>
                    <Text variant="labelMedium" style={styles.sectionLabel}>
                        Selected ({selectedImages.length})
                    </Text>
                    <FlatList
                        data={selectedImages}
                        // Use a combination of image ID, URL and index as the key to ensure uniqueness even if the same image is selected multiple times (This should be prevented by the toggle logic, but this is an extra safeguard as there were errors with duplicate keys during development)
                        keyExtractor={(item, index) => `${item.id}-${item.url}-${index}`}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        renderItem={({ item }) => (
                            // Each selected image is displayed as a thumbnail with an overlay that allows the user to remove it from the selection when tapped
                            <TouchableOpacity onPress={() =>
                                setSelectedImages(prev => prev.filter(img => img.id !== item.id))
                            }>
                                <Image source={{ uri: item.url }} style={styles.selectedThumbnail} />
                                <View style={styles.removeOverlay}>
                                    <Text style={styles.removeIcon}>x</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            )}

            <Searchbar
                placeholder="Search images..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={() => handleSearch(true)}
                onIconPress={() => handleSearch(true)}
                style={styles.searchbar}
            />

            {/* Render the search results in a grid using FlatList */}
            <FlatList
                data={searchResults}
                keyExtractor={item => String(item.id)}
                numColumns={3}
                contentContainerStyle={styles.gridContent}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5} // Trigger for loading more images when the user scrolls near the end of the list
                ListFooterComponent={loading ? <ActivityIndicator style={styles.loader} /> : null}
                renderItem={({ item }) => {
                    const isSelected = selectedImages.some(img => img.id === String(item.id));
                    return (
                        // Each image in the search results is displayed in a grid, and tapping on an image toggles its selection state, visually indicating whether it is selected or not
                        <TouchableOpacity onPress={() => toggleImage(item)} style={styles.imageWrapper}>
                            <Image
                                source={{ uri: item.src.medium }}
                                style={[styles.gridImage, isSelected && styles.selectedImage]}
                            />
                            {isSelected && (
                                <View style={styles.checkOverlay}>
                                    <Text style={styles.checkmark}>✓</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                }}
            />

            {/* Dialog for confirming discarding changes if the user attempts to navigate back with unsaved changes */}
            <Portal>
                <Dialog visible={showDiscardDialog} onDismiss={() => setShowDiscardDialog(false)}>
                    <Dialog.Title>Discard changes?</Dialog.Title>
                    <Dialog.Content>
                        <Text>You have unsaved changes. If you leave now, they will be lost.</Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setShowDiscardDialog(false)}>Stay</Button>
                        <Button textColor={InkwellColors.error} onPress={discardChanges}>
                            Discard
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
        paddingRight: Spacing.lg,
    },
    titleInput: {
        marginHorizontal: Spacing.xl,
        marginBottom: Spacing.sm,
    },
    descriptionInput: {
        marginHorizontal: Spacing.xl,
        marginBottom: Spacing.sm,
    },
    selectedSection: {
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.xs,
    },
    sectionLabel: {
        opacity: 0.6,
        marginBottom: Spacing.xs,
    },
    selectedThumbnail: {
        width: 64,
        height: 64,
        borderRadius: BorderRadius.sm,
        marginRight: Spacing.xs,
    },
    removeOverlay: {
        position: 'absolute',
        top: 2,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: BorderRadius.sm,
        width: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeIcon: {
        color: 'white',
        fontSize: 10,
    },
    searchbar: {
        marginHorizontal: Spacing.lg,
        marginVertical: Spacing.sm,
        backgroundColor: InkwellColors.background,
        borderWidth: 1.5,
        borderColor: InkwellColors.surfaceVariant,
    },
    imageWrapper: {
        margin: Spacing.xs,
        position: 'relative',
    },
    gridImage: {
        width: IMAGE_SIZE,
        height: IMAGE_SIZE,
    },

    gridContent: {
        paddingHorizontal: Spacing.lg,
        alignItems: 'center',
    },
    selectedImage: {
        opacity: 0.6,
    },
    checkOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    checkmark: {
        color: 'white',
        fontSize: 28,
        fontWeight: 'bold',
    },
    loader: {
        padding: Spacing.md,
    },
});