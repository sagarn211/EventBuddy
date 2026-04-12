# Backend Setup Guide

## Configuration

This project requires several configuration files to run. Follow these steps to set up your environment:

### 1. Firebase Service Account

Firebase authentication credentials are needed to connect to the backend.

1. Get your Firebase service account JSON file from [Firebase Console](https://console.firebase.google.com/):
   - Go to Project Settings → Service Accounts
   - Click "Generate New Private Key"

2. Create `config/firebase-service-account.json` and paste the contents:
   ```bash
   cp config/firebase-service-account.json.example config/firebase-service-account.json
   # Then edit the file with your actual Firebase credentials
   ```

### 2. Environment Variables

1. Copy the example `.env` file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your actual values:
   - `FIREBASE_API_KEY` - From Firebase Console
   - `IMAGEKIT_PUBLIC_KEY` - From ImageKit dashboard
   - `IMAGEKIT_PRIVATE_KEY` - From ImageKit dashboard
   - `IMAGEKIT_URL_ENDPOINT` - Your ImageKit URL endpoint
   - `JWT_SECRET` - Create a strong random string for JWT signing
   - `MONGODB_URI` - Your MongoDB connection string (if applicable)

### 3. ImageKit Configuration

ImageKit is used for image processing and storage. Get your credentials from [ImageKit Dashboard](https://imagekit.io/dashboard):
- Public Key
- Private Key  
- URL Endpoint

Add these to your `.env` file. The `imagekit.config.js` file will automatically load them.

## Important Security Notes

- **Never commit** `.env` or `firebase-service-account.json` files
- **Never share** your Firebase credentials, API keys, or JWT secrets
- Always use `.gitignore` to prevent accidental commits of sensitive files
- Rotate API keys and secrets regularly in production

## Running the Server

After configuration:

```bash
npm install
npm start
```

## Troubleshooting

- If Firebase auth fails, verify your `firebase-service-account.json` is valid
- If image uploads fail, check your ImageKit credentials are correct
- Check `.env` file syntax if environment variables aren't loading
