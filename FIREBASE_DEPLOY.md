# Deploying to Firebase Hosting

Since this application uses **API Routes** (for Authentication Sync) and Server-Side Logic, we cannot use basic static hosting. We must use **Firebase Web Frameworks** which automatically handles the server side using Cloud Functions.

## Prerequisites
- Node.js installed
- Firebase CLI installed (`npm install -g firebase-tools`)
- A Firebase project created in the [Firebase Console](https://console.firebase.google.com)

## Step-by-Step Deployment

### 1. Login to Firebase
Open your terminal and run:
```bash
firebase login
```

### 2. Enable Web Frameworks
Enable the experimental support for Next.js:
```bash
firebase experiments:enable webframeworks
```

### 3. Initialize Hosting
Run the initialization command:
```bash
firebase init hosting
```

**Follow these prompts carefully:**
- **Project Setup**: Select "Use an existing project" -> choose `zero2hero-waste-management` (or your project ID).
- **Web Framework**: It should say `? Detected an existing Next.js codebase in the current directory, should we use this?` -> **Yes**.
- **Server Side Content**: `? In which region would you like to host server-side content?` -> Choose a region close to your database (e.g., `us-central1`).
- **Automatic Builds**: `? Set up automatic builds and deploys with GitHub?` -> **No** (unless you want to set up Actions now).

This process will automatically create a `firebase.json` configured for Next.js.

### 4. Deploy
Now run the deployment command:
```bash
firebase deploy
```

## Important Notes

### Environment Variables
For Firebase Functions to access your keys (like `DATABASE_URL` and `CUSTOM_AUTH_SECRET`), you cannot Just rely on `.env.local` in production.

You likely need to set them in the Firebase Functions config if the auto-detection doesn't pick them up, or ensure `.env` is included in the build (which can be risky).

**Better Approach for Env Vars:**
The safer way is to use `firebase functions:config:set` but typical Next.js on Firebase integration tries to read `.env` files. Ensure you have your production secrets set up.

If deployment fails due to missing secrets:
1. Create a `.env` file (not `.env.local`) with your production keys.
2. OR configure Google Cloud Secret Manager.

### Database Latency
Since your database is likely on Neon (AWS) and Firebase Functions run on Google Cloud, ensure you pick a region that minimizes latency (e.g., `us-east1` or `us-central1`).
