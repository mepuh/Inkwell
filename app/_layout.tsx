import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "../context/AuthContext";

// This is the root layout for the app. It wraps all the screens and handles authentication logic.
function RootNavigator() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    // Check if the current route is in the auth group (for example /(auth)/login)
    const inAuthGroup = segments[0] === "(auth)";

    // If the user is not authenticated and not in the auth group, redirect to the login page
    if (!user && !inAuthGroup) {
      router.replace("/(auth)/login");
      // Otherwise, if the user is authenticated and in the auth group, redirect to the home page
    } else if (user && inAuthGroup) {
      router.replace("/(tabs)/home");
    }
  }, [user, loading, segments, router]);

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
