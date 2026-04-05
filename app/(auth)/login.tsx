import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, TextInput, Button } from 'react-native-paper';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebaseConfig';
import { useRouter } from 'expo-router';


export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async () => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch {
            setError("Invalid email or password. Please try again.");
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text variant='headlineLarge'>Inkwell</Text>
            <Text variant='bodyLarge'>Sign in to start creating!</Text>
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
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <Button mode="contained" onPress={handleLogin}>
                Sign in
            </Button>
            <Button mode='text' onPress={() => router.push('/(auth)/register')}>
                Don&apos;t have an account? Register
            </Button>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        gap: 16,
    },
    input: {
        width: '100%',
    },
    errorText: {
        color: 'red',
    },
}); 
