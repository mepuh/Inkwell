# Inkwell

<p align="center">
	<img src="assets/images/inkwell/inkwell-logo-large.png" alt="Inkwell logo" width="300" />
</p>

Inkwell is a personal creative writing companion built with Expo and React Native that brings all the tools a writer needs into one place. It combines book discovery, quote browsing, story generation, moodboards, and a private notebook into one mobile app so ideas, references, and drafts stay in one place.

The app is built for writers at any stage — from the first spark of an idea to the deep work of building characters, worlds, and plot. It supports both quick inspiration and more organized planning. The app is a useful tool for anyone who likes collecting ideas visually and structurally.

## What It Does

Inkwell gives you a focused set of tools for the writing process:

- Book search for finding references and inspiration through Google Books with title, author, and subject filters, preview availability filtering, and direct in-app browser access to previews and full book information.
- Generator for creating story material on demand: characters with names, personality traits, goals and conflicts, world locations with descriptions, and story prompts with plot twists and dialogue lines. Individual fields can be rerolled independently, and results can be saved to a personal idea bank and copied to clipboard.
- Quotes for fetching inspirational quotes from a large quotes API, filter by category or author, use the Muse pick for a surprise, and copy results straight to the clipboard.
- Moodboards for collecting and viewing visual inspiration with image search powered by Pexels API. Each board is saved to the cloud and viewable in a full image grid with individual image preview.
- Notebook for keeping writing notes, outlines, and rough drafts.
- Favourites and saved ideas for storing useful books and generator output for later use.
- Account screens for sign in, registration, and password management.

## Technology Used

This app was built with the following technologies:

- Expo SDK 54 for the app runtime and development tooling. Tested throughout development using Expo Go on Android.
- React Native for the mobile UI layer.
- TypeScript for type-safe application code throughout entire project.
- Expo Router for file-based navigation and route groups.
- React Native Paper for components and theming.
- Firebase Authentication for user sign-in, registration, password changes, and account sessions.
- Firebase Realtime Database for storing user-specific books, notes, moodboards, and saved generator ideas.
- Google Books API for book search, metadata, and preview links.
- API Ninjas Quotes API for inspirational quote search and category-based filtering.
- Pexels API for curated and searchable moodboard images.
- Expo Clipboard for copying quotes and saved ideas to device clipboard.
- Expo Web Browser for opening book previews and book information pages from within the app.
- React Native Keyboard Controller for better keyboard handling on form-heavy screens.
- Local JSON datasets for the generator, including names, traits, goals, conflicts, locations, dialogue prompts, plot twists, and for writing quotes for the home screen.

## Central Libraries Used

These were some of the central libraries used in the implementation:

- `expo-router` for file-based routing, navigation, and route groups.
- `react-native-paper` for most UI components (cards, buttons, chips, dialogs, inputs, searchbars, FABs, activity indicators, etc).
- `firebase` SDK modules (`firebase/auth`, `firebase/database`) for authentication and user data storage.
- `react-native-safe-area-context` for safe layout handling across devices.
- `@expo/vector-icons` for tab bar and UI icons.
- `react-native-render-html` for rendering rich book descriptions returned by the Books API.
- `react-native-keyboard-controller` for better keyboard behavior on forms and text-heavy screens.

### Core React Native Components Used

Alongside external libraries, the app also relies heavily on core React Native components:

- `FlatList` for rendering books, notes, and moodboard image grids efficiently.
- `Modal` for full-screen image previews in moodboards.
- `TouchableOpacity` for custom pressable interactions (for example image tapping in moodboards).
- `BackHandler` for intercepting Android hardware back-button actions in editor screens with unsaved changes.
- `ScrollView` and `View` for screen structure and flexible layout composition.
- `Image` for local branding assets and remote book/moodboard images.
- `Text`, `StyleSheet`, and `useWindowDimensions` for UI content and responsive styling.

## Project Structure

- `app/` contains all screens and route groups including (auth)/ for login and register, (tabs)/ for the main tab screens, and standalone screens for quotes, book details, note editor, moodboard editor, moodboard viewer, and settings.
- `context/` contains shared application state including Firebase authentication context.
- `services/` contains Firebase configuration, database service, generator logic and all external API integrations (books, quotes, images).
- `assets/data/` contains the local JSON datasets used by the generator.
- `assets/images/` contains app branding and UI imagery.
- `constants/` contains app-wide theme.

## Notes

All user data is stored in Firebase Realtime Database with per-user security rules, keeping the architecture consistent and simple. Each signed-in user gets their own favorite books, notes, moodboards, and saved ideas.

Rather than using an external AI or generative API, the generator is built on curated local JSON datasets. This keeps the feature fast, free, fully offline-capable, and gives complete control over the quality and tone of generated content.

## Features Considered But Not Included

Two features were planned and researched but ultimately excluded from this version:

- Camera and gallery image upload — adding photos from the device camera or gallery to moodboards was planned and the relevant Expo SDK packages (expo-camera, expo-media-library) were researched. The feature was not included because storing image files requires Firebase Storage, which is no longer available on the free Spark plan as of early 2026. Saving images as Base64 strings in the Realtime Database was considered but rejected due to the 10MB node size limit.
- Interactive drag-and-drop moodboard sorting — several libraries were evaluated including react-native-draggable-flatlist and react-native-sortables. All require either Gesture Handler native configuration or Reanimated 4 with New Architecture support, neither of which is available in Expo Go. A development build would be required to use these libraries reliably.

## Future Expansion Ideas

Possible next steps for improving Inkwell:

- Smarter book search capabilities, such as ranking, richer filters, and suggestion/autocomplete behavior.
- Better image search capabilities, such as tag-based filtering, color/orientation presets, or saved search presets.
- More intelligent generator output by using the existing JSON tags and relationships instead of purely random picks for more context-aware combinations.
- More interactive moodboards with sorting, grouping, and drag-and-drop arranging.
- Camera and gallery image support once a suitable free storage solution is identified.
- Optional sharing features (for example using React Native Share) for quotes, notes, or generator snapshots.
- Optional haptics to provide tactile feedback for key actions.
- Writing reminders and light productivity support through local notifications.