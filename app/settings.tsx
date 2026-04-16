import { useRouter } from 'expo-router';
import { EmailAuthProvider, reauthenticateWithCredential, signOut, updatePassword } from 'firebase/auth';
import { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Button, Divider, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../services/firebaseConfig';

export default function SettingsScreen() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const router = useRouter();

    // Sign out the user
    const handleSignOut = async () => {
        try {
            await signOut(auth);
        } catch {
            setError('Failed to sign out. Please try again.');
        }
    };

    const confirmSignOut = () => {
        Alert.alert('Close the book?', 'Are you sure you want to sign out?', [
            { text: 'Cancel' },
            { text: 'Sign out', onPress: handleSignOut },
        ]);
    };

    // Change the user's password
    const handleChangePassword = async () => {
        // If changing password right after successful password change, clear success message when user presses the button again
        setSuccess('');

        if (!currentPassword || !newPassword) {
            setError('Please fill in all fields.');
            return;
        }
        if (newPassword.length < 8) {
            setError('New password must be at least 8 characters.');
            return;
        }
        try {
            const user = auth.currentUser;
            if (!user || !user.email) return;

            // Re-authenticate the user before updating the password
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);

            setSuccess('Password updated successfully!');
            // Clear input fields and error message after successful password change
            setCurrentPassword('');
            setNewPassword('');
            setError('');
        } catch {
            setError('Failed to change password. Make sure your current password is correct.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAwareScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                bottomOffset={24}
            >
            <Text variant="headlineMedium">Settings</Text>

            <Text variant="titleMedium">Account</Text>
            <Text variant="bodyMedium">{auth.currentUser?.email}</Text>

            <Divider />

            <Text variant="titleMedium">Change Password</Text>
            <TextInput
                label="Current Password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
            />
            <TextInput
                label="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {success ? <Text style={styles.success}>{success}</Text> : null}
            <Button mode="contained" onPress={handleChangePassword}>
                Update Password
            </Button>

            <Divider />

            <Button
                mode="contained"
                onPress={confirmSignOut}
                icon="exit-to-app"
                contentStyle={styles.signOutButtonContent}
            >
                Sign Out
            </Button>

            <Button
                mode="text"
                onPress={() => router.push('/(tabs)/home')}
                icon="arrow-left"
                style={{ marginTop: 48 }}>
                Back to Home
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
        padding: 16,
        gap: 16,
    },
    error: {
        color: 'red',
    },
    success: {
        color: 'green',
    },
    signOutButtonContent: {
        flexDirection: 'row-reverse',
    },
});