# Guide: Packaging FieldSync as an iOS App for the Apple App Store

This guide explains how to wrap the FieldSync web app into a native iOS project using **Capacitor**, run it in the Simulator, and compile it for App Store distribution.

---

## Prerequisites

1. **Xcode**: Install Xcode from the Mac App Store (requires macOS).
2. **Node.js**: Ensure Node.js and NPM are installed.
3. **Cocoapods**: Run `sudo gem install cocoapods` in the terminal (required for Capacitor iOS dependencies).

---

## Step 1: Install Capacitor

Open your terminal in this project directory and install the Capacitor core packages:

```bash
npm install @capacitor/core @capacitor/cli
```

---

## Step 2: Initialize Capacitor Config

Run the initialization wizard to name your app and set its bundle ID (used for App Store identification):

```bash
npx cap init "FieldSync" "com.fieldsync.contracts" --web-dir=public
```

*This command generates a `capacitor.config.json` file pointing to `public` as the web asset directory.*

---

## Step 3: Add the iOS Platform

Install the iOS integration package and add the platform folder:

```bash
npm install @capacitor/ios
npx cap add ios
```

*This will generate an Xcode project inside the `./ios` directory of your workspace.*

---

## Step 4: Sync Web Assets to iOS Project

Whenever you make changes to HTML, CSS, or JS files in the `public/` directory, sync them to Xcode by running:

```bash
npx cap copy
```

---

## Step 5: Open and Run in Xcode

Open the native iOS project in Xcode automatically:

```bash
npx cap open ios
```

### In Xcode:
1. Select a simulator or real connected device at the top.
2. Click the **Run (Play button)** to launch the app!
3. To configure the App Store signing, select the **App** project in the left pane, navigate to **Signing & Capabilities**, and assign your Apple Developer Team profile.
4. Set the build destination to **Any iOS Device (arm64)**, go to **Product > Archive**, and click **Distribute App** to upload it directly to the App Store Connect!

---

## Configuration Note (Connecting to Backend)

In `public/script.js`, we have implemented a smart URL resolver (`API_BASE_URL`).
By default, inside the simulator/app wrapper, it points to `http://localhost:8888`.
When deploying your production backend, replace the fallback URL `'http://localhost:8888'` with your public server domain (e.g. `'https://api.yourdomain.com'`).
