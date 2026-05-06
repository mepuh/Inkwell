import { get, push, ref, remove, set, update } from 'firebase/database';
import { auth, database } from './firebaseConfig';

// Helper function to get a reference to the current user's data in the database
const userRef = (path: string) => {
    const uid = auth.currentUser?.uid;
    // Centralized auth guard so all per-user paths fail fast when no user is signed in
    if (!uid) throw new Error('User not authenticated');
    return ref(database, `users/${uid}/${path}`);
};

// ========== FAVOURITE BOOKS ==========

export type FavouriteBook = {
    id: string;
    title: string;
    authors: string[];
    thumbnail: string;
    savedAt: number;
};

// Function to add a book to the user's list of favourite books in the database
export const addFavouriteBook = async (book: FavouriteBook): Promise<void> => {
    await set(ref(database, `users/${auth.currentUser?.uid}/favouriteBooks/${book.id}`), book);
};

// Function to remove a book from the user's list of favourite books in the database by its ID
export const removeFavouriteBook = async (id: string): Promise<void> => {
    await remove(ref(database, `users/${auth.currentUser?.uid}/favouriteBooks/${id}`));
};

// Function to fetch all favourite books for the current user from the database, returning them as an array of FavouriteBook objects
export const getFavouriteBooks = async (): Promise<FavouriteBook[]> => {
    const snapshot = await get(userRef('favouriteBooks'));
    if (!snapshot.exists()) return [];
    const data = snapshot.val();
    // Firebase stores favourite books as an object map keyed by book id
    return Object.values(data) as FavouriteBook[];
};

// Function to check if a specific book is in the user's list of favourite books by its ID, returning true if it exists and false otherwise
export const isBookFavourited = async (id: string): Promise<boolean> => {
    const snapshot = await get(
        ref(database, `users/${auth.currentUser?.uid}/favouriteBooks/${id}`)
    );
    return snapshot.exists();
};

// ========== SAVED IDEAS (Generator) ==========

export type SavedIdea = {
    id?: string;
    title: string;
    content: string;
    savedAt: number;
    payload?: string; // Optional field to store the raw generator output as JSON string for later reference
};

// Function to add a new saved idea to the database, returning the generated idea ID
export const addSavedIdea = async (idea: Omit<SavedIdea, 'id'>): Promise<string> => {
    const newRef = push(userRef('savedIdeas'));
    await set(newRef, idea);
    return newRef.key!;
};

// Function to delete a saved idea from the database by its ID
export const deleteSavedIdea = async (id: string): Promise<void> => {
    await remove(userRef(`savedIdeas/${id}`));
};

// Function to fetch all saved ideas for the current user from the database
export const getSavedIdeas = async (): Promise<SavedIdea[]> => {
    const snapshot = await get(userRef('savedIdeas'));
    if (!snapshot.exists()) return [];
    const data = snapshot.val();
    return Object.entries(data).map(([id, idea]) => ({
        id,
        ...(idea as Omit<SavedIdea, 'id'>),
    }));
};

// ========== MOODBOARDS ==========

export type MoodboardImage = {
    id: string;
    url: string;
    photographer?: string;
    alt?: string;
};

export type Moodboard = {
    id?: string;
    title: string;
    description?: string;
    images: MoodboardImage[];
    createdAt: number;
    updatedAt: number;
};

// Function to add a new moodboard to the database, returning the generated moodboard ID
export const addMoodboard = async (moodboard: Omit<Moodboard, 'id'>): Promise<string> => {
    const newRef = push(userRef('moodboards'));
    await set(newRef, moodboard);
    return newRef.key!;
};

// Function to update an existing moodboard in the database by its ID
export const updateMoodboard = async (id: string, moodboard: Partial<Omit<Moodboard, 'id'>>): Promise<void> => {
    await update(userRef(`moodboards/${id}`), moodboard);
};

// Function to delete a moodboard from the database by its ID
export const deleteMoodboard = async (id: string): Promise<void> => {
    await remove(userRef(`moodboards/${id}`));
};

// Function to fetch a single moodboard by its ID for the current user
export const getMoodboardById = async (id: string): Promise<Moodboard | null> => {
    const snapshot = await get(userRef(`moodboards/${id}`));
    if (!snapshot.exists()) return null;
    return {
        id,
        ...(snapshot.val() as Omit<Moodboard, 'id'>),
    };
};

// Function to fetch all moodboards for the current user from the database, returning them as an array of Moodboard objects
export const getMoodboards = async (): Promise<Moodboard[]> => {
    const snapshot = await get(userRef('moodboards'));
    if (!snapshot.exists()) return [];
    const data = snapshot.val();
    return Object.entries(data).map(([id, board]) => ({
        id,
        ...(board as Omit<Moodboard, 'id'>),
    }));
};

// ========== NOTEBOOK ==========

export type Note = {
    id?: string;
    title: string;
    content: string;
    createdAt: number;
    updatedAt: number;
};

// Function to add a new note to the database, returning the generated note ID
export const addNote = async (note: Omit<Note, 'id'>): Promise<string> => {
    const newRef = push(userRef('notebook'));
    await set(newRef, note);
    return newRef.key!;
};

// Function to update an existing note in the database by its ID
export const updateNote = async (id: string, note: Partial<Omit<Note, 'id'>>): Promise<void> => {
    await update(userRef(`notebook/${id}`), note);
};

// Function to delete a note from the database by its ID
export const deleteNote = async (id: string): Promise<void> => {
    await remove(userRef(`notebook/${id}`));
};

// Function to fetch a single note by its ID for the current user
export const getNoteById = async (id: string): Promise<Note | null> => {
    const snapshot = await get(userRef(`notebook/${id}`));
    if (!snapshot.exists()) return null;
    return {
        id,
        ...(snapshot.val() as Omit<Note, 'id'>),
    };
};

// Function to fetch all notes for the current user from the database, returning them as an array of Note objects
export const getNotes = async (): Promise<Note[]> => {
    const snapshot = await get(userRef('notebook'));
    if (!snapshot.exists()) return [];
    const data = snapshot.val();
    return Object.entries(data).map(([id, note]) => ({
        id,
        ...(note as Omit<Note, 'id'>),
    }));
};