# Munchy's Grill

The official Munchy's Grill web, iPhone, and Android app codebase. The website is deployed on Vercel, and the native app lives in [`mobile/`](./mobile).

The native app provides a fast Munchy's-branded menu, search, categories, favorites, restaurant information, directions, and calling. Menu data is loaded from Toast through a server-side Vercel endpoint, while checkout opens Toast's secure hosted ordering flow.

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

## Toast API setup

Copy [`.env.example`](./.env.example) to your local environment and configure these secrets in Vercel:

- `TOAST_CLIENT_ID`
- `TOAST_CLIENT_SECRET`
- `TOAST_RESTAURANT_GUID`

The Toast credentials stay on the server. They are never included in the website or native app bundle. Until they are configured, the native app uses its built-in menu preview and still sends orders to Munchy's existing Toast checkout.

## Native app

```bash
cd mobile
npm install
npm run ios
# or: npm run android
```

Release profiles for iPhone and Android are defined in [`mobile/eas.json`](./mobile/eas.json). See [`mobile/README.md`](./mobile/README.md) for build and submission commands.

## Website app links

Once the store listings are public, set these Vercel variables and redeploy:

- `VITE_APP_STORE_URL`
- `VITE_PLAY_STORE_URL`

The website automatically replaces the coming-soon badges with official download buttons. Until then, its existing home-screen install option remains available.

## Install the website on a phone

- iPhone/iPad: open the live site in Safari, tap Share, then **Add to Home Screen**.
- Android: open the live site in Chrome and tap **Install app** when prompted.

The app manifest, home-screen icons, install controls, and offline shell are included in this repository. Production hosting is configured for Vercel.
