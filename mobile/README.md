# Munchy's Grill mobile app

Native iPhone and Android app built with React Native and Expo SDK 57.

## Run locally

```bash
npm install
npx expo start
```

The app defaults to the production Vercel API. To use another backend, copy `.env.example` to `.env.local` and change `EXPO_PUBLIC_API_BASE_URL`.

## Validate

```bash
npx tsc --noEmit
npx expo-doctor
npx expo export --platform ios
npx expo export --platform android
```

## Build store binaries

```bash
npx eas-cli@latest login
npx eas-cli@latest build --platform all --profile production
```

## Submit

```bash
npx eas-cli@latest submit --platform ios --profile production
npx eas-cli@latest submit --platform android --profile production
```

Store submission requires access to Munchy's Apple Developer and Google Play Console accounts. Apple also requires listing metadata, screenshots, a privacy policy URL, and App Review approval. Google requires a completed Play Store listing and release/testing requirements.
