# virai

VirAI is a React Native AI chat app with Firebase Authentication and Firestore conversation history.

## Firebase Authentication

Email/password sign-in, account registration, Google sign-in, password reset, and logout are implemented. New email/password accounts are created in Firebase Authentication and automatically signed in.

Firebase Authentication sessions persist across app restarts and expire seven days after the user's most recent successful sign-in. Signing out manually ends the session immediately.

1. In Firebase Console, enable **Authentication → Sign-in method → Email/Password** and **Google**.
2. The Firebase Web app configuration is used by the JavaScript Authentication and Firestore SDKs in `src/config/firebase.ts`.
3. In **Project settings → Your apps**, register an Android app with package name `com.virai` and an iOS app with bundle ID `com.virai`. App identifiers cannot be changed after registration; if you previously registered `com.deneme`, add new Android and iOS app entries using `com.virai`.
4. Download each native configuration file:
   - Android: `google-services.json` → `android/app/google-services.json`
   - iOS: `GoogleService-Info.plist` → `ios/virai/GoogleService-Info.plist`
5. For Google Sign-In, register the Android signing SHA-1/SHA-256 fingerprints (`cd android && ./gradlew signingReport`), and complete the OAuth client ID and iOS URL scheme values described in `src/config/firebase.ts` and `ios/virai/Info.plist`.

The native Firebase configuration files are required for Firebase AI Logic. They are not generated from the Web app configuration.

## VirAI chat and conversation history

VirAI generates chat replies through **Firebase AI Logic**. Messages are sent from the client; user and assistant messages are written to that authenticated user's Firestore path and are available to reopen and continue. The app does not use Cloud Functions, Groq, or Firebase Storage for chat.

### One-time Firebase setup

1. In Firebase Console, create a **Cloud Firestore** database.
2. In **AI Logic**, select and enable the AI provider for the Firebase project. No provider API key or Cloud Functions secret is added to the app.
3. Add the Android and iOS app registrations and native config files described above, then rebuild the native app.
4. Deploy the owner-scoped chat rules:

   ```sh
   npx firebase-tools login
   npx firebase-tools deploy --only firestore:rules --project deneme-7d49d
   ```

5. Run the app with `npm run android` or `npm run ios`.

Firebase AI Logic usage may have a no-cost tier, but it is quota-limited and can change; free use is not unlimited or guaranteed in every region. Firestore also has usage quotas. Configure Firebase usage alerts and review Google's data and AI service terms before sending sensitive information. Enable Firebase App Check for the AI Logic API before production release to reduce unauthorized usage.

The client includes up to 20 previous successful messages as conversation context. Messages are limited to 6,000 characters, and generated responses are capped at 2,048 output tokens. Conversations and messages are private to the authenticated Firebase user according to `firestore.rules`.

The conversation list supports searching and renaming saved conversations. Failed user messages can be retried, and new conversations show example prompts.

The chat composer supports Turkish speech-to-text through the device's native speech recognition service. The recognized text is placed in the composer for review before sending. Assistant messages can be read aloud with the device's text-to-speech engine; playback continues while navigating between app screens and can be paused, resumed, or stopped from the global mini-player. Microphone and speech-recognition permissions are requested when voice input is first used. Rebuild and reinstall the native app after installing the voice modules. Android emulators need a Google Play system image with Google Speech Services installed and microphone access enabled. iOS also requires the microphone and speech-recognition permission descriptions in `Info.plist`.

If Cloud Functions were deployed during earlier setup, removing their source from this repository does not delete the deployed function. Delete any old `sendChatMessage` function from Firebase Console if it is no longer needed. The App Check package is installed, but no attestation provider is initialized; configure one before enforcing App Check on the AI Logic API.
