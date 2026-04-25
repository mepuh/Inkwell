import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { InkwellColors } from "../../constants/theme";

export default function Layout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: InkwellColors.background,
                    borderTopColor: InkwellColors.neutral200,
                },
                tabBarActiveTintColor: InkwellColors.onBackground,
                tabBarInactiveTintColor: InkwellColors.onSurfaceVariant,
            }}
        >
            <Tabs.Screen
                name="books"
                options={{
                    title: "Books",
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="bookshelf" color={color} size={size} />
                    ),
                }}
            />
            <Tabs.Screen
                name="generator"
                options={{
                    title: "Generator",
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="magic-staff" color={color} size={size} />
                    ),
                }}
            />
            <Tabs.Screen
                name="home"
                options={{
                    title: "Home",
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="home" color={color} size={size} />
                    ),
                }}
            />
            <Tabs.Screen
                name="moodboard"
                options={{
                    title: "Moodboard",
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="image-frame" color={color} size={size} />
                    ),
                }}
            />
            <Tabs.Screen
                name="notebook"
                options={{
                    title: "Notebook",
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="notebook-edit-outline" color={color} size={size} />
                    ),
                }}
            />
        </Tabs>
    );
}