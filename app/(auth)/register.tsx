import { useRouter } from 'expo-router';
import { FirebaseError } from 'firebase/app';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Button, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InkwellColors, Spacing } from '../../constants/theme';
import { auth } from '../../services/firebaseConfig';

export default function RegisterScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleRegister = async () => {
        if (!email || !password || !confirmPassword) {
            setError("Please fill in all fields.");
            return;
        }
        if (!/\S+@\S+\.\S+/.test(email)) { // Basic email format validation
            setError("Please enter a valid email address.");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match. Please try again.");
            return;
        }
        if (password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }

        setError('');

        try {
            await createUserWithEmailAndPassword(auth, email, password);
        } catch (err: unknown) {
            // Handle specific Firebase authentication errors to provide more user-friendly feedback
            if (err instanceof FirebaseError) {
                switch (err.code) {
                    case 'auth/email-already-in-use':
                        setError('This email is already in use. Try signing in instead.');
                        return;
                    case 'auth/invalid-email':
                        setError('Please enter a valid email address.');
                        return;
                    case 'auth/weak-password':
                        setError('Password is too weak. Please use at least 8 characters.');
                        return;
                    case 'auth/network-request-failed':
                        setError('Network error. Check your connection and try again.');
                        return;
                    case 'auth/too-many-requests':
                        setError('Too many attempts. Please wait a moment and try again.');
                        return;
                    default:
                        break;
                }
            }

            setError('Failed to create account. Please try again.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAwareScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                bottomOffset={24}
            >
            <Text variant='headlineLarge'>Inkwell</Text>
            <Text variant='bodyLarge'>Create an account to get started!</Text>
            <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                mode="outlined"
                style={styles.input}
            />
            <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                mode="outlined"
                style={styles.input}
            />
            <TextInput
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                mode="outlined"
                style={styles.input}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <Button mode="contained" onPress={handleRegister}>
                Register
            </Button>
            <Button mode='text' onPress={() => router.push('/(auth)/login')}>
                Already have an account? Sign in
            </Button>
            </KeyboardAwareScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: InkwellColors.background,
    },
    content: {
        flexGrow: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        padding: Spacing.xxl,
        paddingTop: '20%',
        gap: Spacing.lg,
    },
    input: {
        width: '100%',
    },
    errorText: {
        color: InkwellColors.error,
    },
});