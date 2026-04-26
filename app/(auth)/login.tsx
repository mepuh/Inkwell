import { useRouter } from 'expo-router';
import { FirebaseError } from 'firebase/app';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { Image, StyleSheet } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Button, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InkwellColors, Spacing } from '../../constants/theme';
import { auth } from '../../services/firebaseConfig';


export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async () => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err: unknown) {
            // Handle specific Firebase authentication errors to provide more user-friendly feedback
            if (err instanceof FirebaseError) {
                switch (err.code) {
                    case 'auth/invalid-email':
                        setError('Please enter a valid email address.');
                        return;
                    case 'auth/user-not-found':
                    case 'auth/wrong-password':
                    case 'auth/invalid-credential':
                        setError('Invalid email or password. Please try again.');
                        return;
                    case 'auth/user-disabled':
                        setError('This account has been disabled. Please contact support.');
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

            setError("Invalid email or password. Please try again.");
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAwareScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                bottomOffset={24}
            >
                <Image
                    source={require('../../assets/images/inkwell/inkwell-logo-full.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <Text variant='bodyLarge'>Sign in to start creating!</Text>
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
                    secureTextEntry={!showPassword}
                    right={
                        <TextInput.Icon
                            icon={showPassword ? 'eye' : 'eye-off'}
                            onPress={() => setShowPassword((prev) => !prev)}
                            forceTextInputFocus={false}
                        />
                    }
                    mode="outlined"
                    style={styles.input}
                />
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
                <Button mode="contained" style={styles.button} onPress={handleLogin}>
                    Sign in
                </Button>
                <Button mode='text' onPress={() => router.push('/(auth)/register')}>
                    Don&apos;t have an account? Register
                </Button>
            </KeyboardAwareScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: InkwellColors.surface,
    },
    content: {
        flexGrow: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        padding: Spacing.xxl,
        gap: Spacing.lg,
    },
    logo: {
        width: 270,
        height: 270,

    },
    input: {
        width: '100%',
    },
    errorText: {
        color: InkwellColors.error,
    },
    button: {
        marginTop: Spacing.sm,
    }
}); 
