import { get, push, ref, remove, set, update } from 'firebase/database';
import { auth, database } from './firebaseConfig';

// Helper function to get a reference to the current user's data in the database
const userRef = (path: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('User not authenticated');
    return ref(database, `users/${uid}/${path}`);
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