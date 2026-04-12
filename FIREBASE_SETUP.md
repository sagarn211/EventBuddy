# Firebase Phone Authentication Setup Checklist

The app is stuck on "Sending..." because **Firebase Phone Authentication is likely not enabled** in your Firebase Console.

## ✅ Quick Fix Steps:

### 1. **Enable Phone Provider in Firebase Console**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project: **eventbuddynew**
   - Navigate to: **Authentication** → **Sign-in method**
   - Click on **Phone** provider
   - Enable it ✓
   - Save

### 2. **Register Your App's SHA-1 Fingerprint** (Critical for Android)
   
   Open Terminal and run:
   ```bash
   cd c:\D drive\web-dev\EventBuddyNew\android
   ./gradlew signingReport
   ```
   
   Or for Windows:
   ```bash
   gradlew.bat signingReport
   ```
   
   **Copy the SHA-1 fingerprint** from the output.
   
   Then in Firebase Console:
   - Go to **Project Settings** (⚙️)
   - Select **Android** app: `com.eventbuddynew`
   - Paste the **SHA-1 fingerprint** in the field marked "SHA-1 certificate fingerprint"
   - Save ✓

### 3. **Verify google-services.json**
   - Check: `android/app/google-services.json` exists ✓
   - Contains correct `project_id: "eventbuddynew"` ✓

### 4. **Test Phone Authentication**
   After making changes:
   1. Stop the metro bundler (`npm start`)
   2. Rebuild the app: `npm run android` or `npm run ios`
   3. Try logging in again
   4. Check the console logs for detailed error messages

## 🔍 Debugging

If still stuck:
1. Open **Logcat** (Android Studio) or **Xcode Console** (iOS)
2. Look for errors from Firebase
3. Check if you see "[OTP] 4. Calling signInWithPhoneNumber..." log message
4. If yes, Firebase is trying but failing (check Firebase Console settings)
5. If no, there's an issue before reaching Firebase

## 📝 Common Issues:

| Issue | Solution |
|-------|----------|
| "Sending..." hangs forever | Phone Auth not enabled in Firebase Console |
| "Operation not allowed" error | Enable Phone provider in Firebase Console |
| SMS not received | Correct phone number format (+1 XXXXXXXXXX) |
| Auth timed out after 30s | Check Firebase configuration & SHA-1 fingerprint |

## 🎯 What You're Trying to Do

1. User enters phone number: `+1 6505551234`
2. Click "Get OTP Code"
3. Firebase `signInWithPhoneNumber()` sends SMS
4. User gets 6-digit code
5. Enters code in OtpVerifyScreen
6. Backend validates and logs them in

**Your app is stuck at step 3.**

## ⚠️ Important Notes

- test phone numbers only work on real devices or configured test devices
- Firebase Console → Authentication → Phone → Manage test phone numbers
- Never share your private key from google-services.json
