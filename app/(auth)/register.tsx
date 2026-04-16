import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Button, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
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
        try {
            await createUserWithEmailAndPassword(auth, email, password);
        } catch {
            setError("Failed to create account. Please check your details and try again.");
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
                style={styles.input}
            />
            <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={styles.input}
            />
            <TextInput
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
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
    },
    content: {
        flexGrow: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        padding: 24,
        paddingTop: '20%',
        gap: 16,
    },
    input: {
        width: '100%',
    },
    errorText: {
        color: 'red',
    },
});