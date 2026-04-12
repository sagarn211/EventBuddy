import auth from "@react-native-firebase/auth";

export const debugFirebase = async () => {
  try {
    console.log("=== Firebase Debug Info ===");
    
    // Check if Firebase is initialized
    const firebaseApp = auth().app;
    console.log("[Firebase] App initialized:", !!firebaseApp);
    
    // Check Firebase app name
    console.log("[Firebase] App name:", firebaseApp?.name);
    
    // Check project ID
    console.log("[Firebase] Project ID:", firebaseApp?.options?.projectId);
    
    // Check if auth is enabled
    const authInstance = auth();
    console.log("[Firebase] Auth instance ready:", !!authInstance);
    
    // Test settings (don't actually send SMS)
    console.log("[Firebase] Language code:", authInstance.languageCode || "default");
    
    // Check current user
    const currentUser = auth().currentUser;
    console.log("[Firebase] Current user:", currentUser?.phoneNumber || "none");
    
    return true;
  } catch (error) {
    console.error("[Firebase] Debug error:", error);
    return false;
  }
};

export const testPhoneAuth = async (phone) => {
  try {
    console.log("=== Testing Phone Auth for:", phone, "===");
    
    // Set reCAPTCHA config (optional, might be needed)
    try {
      auth().settings.appVerificationDisabledForTesting = false;
    } catch (e) {
      console.log("[Firebase] appVerificationDisabledForTesting not available");
    }
    
    console.log("[Firebase] Starting signInWithPhoneNumber...");
    const confirmation = await Promise.race([
      auth().signInWithPhoneNumber(phone),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Phone auth timeout after 30s")), 30000)
      ),
    ]);
    
    console.log("[Firebase] Phone verification code sent successfully!");
    return confirmation;
  } catch (error) {
    console.error("[Firebase] Phone auth error:", {
      code: error.code,
      message: error.message,
      nativeErrorMessage: error.nativeErrorMessage,
    });
    throw error;
  }
};
