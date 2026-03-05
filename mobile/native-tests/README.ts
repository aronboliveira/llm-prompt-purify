/**
 * Raw Espresso / XCTest scaffold for LLM Prompt Purify Mobile.
 *
 * These files are meant to be copied into the native project directories
 * after running `npx expo prebuild`:
 *
 *   Android (Espresso):
 *     android/app/src/androidTest/java/com/llmpromptpurify/mobile/
 *
 *   iOS (XCTest):
 *     ios/LLMPromptPurifyUITests/
 *
 * They provide additional native-level testing beyond what Detox covers
 * (e.g. accessibility, deep link handling, native module integration).
 *
 * After `expo prebuild`:
 *   1. cp native-tests/android/*.kt android/app/src/androidTest/java/com/llmpromptpurify/mobile/
 *   2. cp native-tests/ios/*.swift ios/LLMPromptPurifyUITests/
 *   3. Android: cd android && ./gradlew connectedAndroidTest
 *   4. iOS: xcodebuild test -workspace ios/*.xcworkspace -scheme LLMPromptPurify -destination 'platform=iOS Simulator,name=iPhone 15 Pro'
 */
export {};
