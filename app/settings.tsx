import { useRouter } from 'expo-router';
import { EmailAuthProvider, reauthenticateWithCredential, signOut, updatePassword } from 'firebase/auth';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Button, Dialog, Divider, IconButton, Portal, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InkwellColors, Spacing } from '../constants/theme';
import { auth } from '../services/firebaseConfig';

export default function SettingsScreen() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [signOutDialogVisible, setSignOutDialogVisible] = useState(false);
    const router = useRouter();

    // Sign out the user
    const handleSignOut = async () => {
        try {
            await signOut(auth);
            setSignOutDialogVisible(false);
        } catch {
            setError('Failed to sign out. Please try again.');
            setSignOutDialogVisible(false);
        }
    };

    const showSignOutDialog = () => {
        setSignOutDialogVisible(true);
    };

    const hideSignOutDialog = () => {
        setSignOutDialogVisible(false);
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
            <View style={styles.header}>
                <IconButton icon="arrow-left" onPress={() => router.back()} />
                <Text variant="titleLarge">Settings</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAwareScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                bottomOffset={24}
            >
                <Text variant="titleMedium">Account</Text>
                <Text variant="bodyMedium">{auth.currentUser?.email}</Text>

                <Divider />

                <Text variant="titleMedium">Change Password</Text>
                <TextInput
                    label="Current Password"
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry
                    mode="outlined"
                    style={styles.input}
                />
                <TextInput
                    label="New Password"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                    mode="outlined"
                    style={styles.input}
                />
                {error ? <Text style={styles.error}>{error}</Text> : null}
                {success ? <Text style={styles.success}>{success}</Text> : null}
                <Button mode="contained" onPress={handleChangePassword}>
                    Update Password
                </Button>

                <Divider />

                <Button
                    mode="contained"
                    onPress={showSignOutDialog}
                    icon="exit-to-app"
                    contentStyle={styles.signOutButtonContent}
                    buttonColor={InkwellColors.error}
                >
                    Sign Out
                </Button>

                {/* Dialog to confirm sign out */}
                <Portal>
                    <Dialog visible={signOutDialogVisible} onDismiss={hideSignOutDialog}>
                        <Dialog.Title>Close the book?</Dialog.Title>
                        <Dialog.Content>
                            <Text>Are you sure you want to sign out?</Text>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={hideSignOutDialog}>Cancel</Button>
                            <Button textColor={InkwellColors.error} onPress={handleSignOut}>Sign Out</Button>
                        </Dialog.Actions>
                    </Dialog>
                </Portal>
            </KeyboardAwareScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: InkwellColors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: Spacing.xs,
        paddingRight: Spacing.xs,
        paddingVertical: Spacing.xs,
    },
    content: {
        padding: Spacing.lg,
        gap: Spacing.lg,
        backgroundColor: InkwellColors.background,
    },
    input: {
        marginBottom: Spacing.xs,
    },
    error: {
        color: InkwellColors.error,
    },
    success: {
        color: InkwellColors.primary,
    },
    signOutButtonContent: {
        flexDirection: 'row-reverse',
    },
});