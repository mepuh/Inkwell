import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../services/firebaseConfig";

// Define auth context type with user and loading state
type AuthContextType = {
    user: User | null;
    loading: boolean;
};

// Create the AuthContext with default values (user: null because no one is logged in, and loading: true because Firebase hasn't finished checking the auth state yet)
const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
});

// AuthProvider component to wrap the app and provide auth state to all components
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    // Listen for auth state changes and update user and loading state accordingly
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            setLoading(false);
        });

        // Shuts down the listener when the component unmounts
        return () => unsubscribe();
    }, []);

    // Provide the user and loading state to the rest of the app
    return (
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

// Custom hook to easily access the auth context in any component (much shorter than using useContext(AuthContext) every time)
export function useAuth() {
    return useContext(AuthContext);
}