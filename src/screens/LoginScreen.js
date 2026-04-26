import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  
  Alert,
  ActivityIndicator,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import Ionicons from "react-native-vector-icons/Ionicons";
import Animated, { FadeInDown } from "react-native-reanimated";
import auth from "@react-native-firebase/auth";
import AnimatedBackground from "../components/AnimatedBackground";
import { debugFirebase } from "../utils/firebaseDebug";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { setConfirmation } = useAuth();

  useEffect(() => {
    // Debug Firebase on component mount
    debugFirebase().catch(err => {
      console.error("[LoginScreen] Firebase debug failed:", err);
    });
  }, []);

  const validatePhone = (num) => {
    if (!num) return "Phone number is required";
    if (num.length < 10) return "Enter at least 10 digits";
    if (!num.startsWith('+')) return "Include country code (e.g. +91)";
    return null;
  };


  const handleSendOtp = async () => {
    const err = validatePhone(phone);
    if (err) {
      setError(err);
      return;
    }

    setLoading(true);
    let timeoutId;
    
    try {
      console.log("[OTP] 1. Validating phone:", phone);
      
      // Step 2: Check Firebase is ready
      console.log("[OTP] 2. Checking Firebase auth...");
      const authInstance = auth();
      console.log("[OTP] 3. Firebase auth instance:", !!authInstance);
      
      // Step 3: Call signInWithPhoneNumber with timeout
      console.log("[OTP] 4. Calling signInWithPhoneNumber...");
      
      const phoneAuthPromise = authInstance.signInWithPhoneNumber(phone);
      
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          const timeoutErr = new Error(
            "Firebase phone auth timed out (30s). This usually means:\n" +
            "1. Firebase Phone Authentication is NOT enabled in your Firebase Console\n" +
            "2. SHA-1 fingerprint is not registered for your APK\n" +
            "3. reCAPTCHA is blocking the request\n\n" +
            "To fix:\n" +
            "- Go to Firebase Console > Authentication > Sign-in method\n" +
            "- Enable 'Phone' provider\n" +
            "- Register your app's SHA-1 fingerprint"
          );
          reject(timeoutErr);
        }, 30000);
      });

      console.log("[OTP] 5. Awaiting confirmation...");
      const confirmationResult = await Promise.race([phoneAuthPromise, timeoutPromise]);
      clearTimeout(timeoutId);
      
      console.log("[OTP] 6. Confirmation received successfully!");
      setConfirmation(confirmationResult);
      navigation.navigate("OtpVerify", { phone });
    } catch (error) {
      clearTimeout(timeoutId);
      console.error("[OTP] Send Error:", {
        code: error.code,
        message: error.message,
        nativeErrorMessage: error.nativeErrorMessage,
      });
      
      let errorMessage = error.message || "Failed to send OTP. Please try again.";
      
      if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many attempts. Please try again later.";
      } else if (error.code === 'auth/invalid-phone-number') {
        errorMessage = "Invalid phone number. Use format: +1 6505551234";
      } else if (error.code === 'auth/missing-phone-number') {
        errorMessage = "Phone number is required.";
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = "❌ Phone authentication is NOT enabled in Firebase Console.\n\nGo to: Firebase Console > Authentication > Sign-in method > Enable Phone";
      } else if (error.code === 'auth/web-storage-unsupported') {
        errorMessage = "Storage error. Please restart the app.";
      } else if (error.message?.includes("Firebase Phone Authentication")) {
        errorMessage = "Firebase Phone Auth not configured. Enable it in Firebase Console.";
      }
      
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatedBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        className="flex-1"
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1 }} 
          className="px-6"
          keyboardShouldPersistTaps="handled"
        >
          {/* Illustration Section */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(800)}
            className="h-[40vh] items-center justify-center -mt-5"
          >
            <View className="relative w-72 h-72 items-center justify-center">
              <View 
                className="absolute w-72 h-72 bg-purple-500/10 rounded-full" 
                style={{ opacity: 0.4 }}
              />
              <Image
                source={{
                  uri: "https://storage.googleapis.com/uxpilot-auth.appspot.com/6570e26536-4c8d3ab0891e6d889412.png",
                }}
                className="w-full h-full"
                resizeMode="contain"
              />
            </View>
          </Animated.View>

          {/* Form Section */}
          <View className="flex-1 -mt-10">
            <Animated.View
              entering={FadeInDown.delay(400).duration(800)}
              className="mb-10 items-center"
            >
              <Text className="text-4xl font-extrabold text-white tracking-tight mb-2">
                Event<Text className="text-purple-400">Buddy</Text>
              </Text>
              <Text className="text-gray-300 text-lg font-medium opacity-80">
                Premium Event Management
              </Text>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(600).duration(800)}
              className="bg-white/5 border border-white/10 rounded-[40px] p-8 shadow-2xl backdrop-blur-xl"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}
            >
              <View className="items-center mb-8">
                <View className="w-16 h-16 bg-purple-500/20 rounded-2xl items-center justify-center mb-4 border border-purple-500/30">
                  <Ionicons name="phone-portrait-outline" size={32} color="#c084fc" />
                </View>
                <Text className="text-2xl font-bold text-white mb-2 text-center">Login with Phone</Text>
                <Text className="text-gray-400 text-center text-sm leading-5">
                  We'll send a 6-digit verification code to your number
                </Text>
              </View>

              {/* Phone Field */}
              <View className="space-y-3 mb-8">
                <Text className="text-xs font-semibold text-purple-300 uppercase tracking-widest ml-1">
                  Phone Number
                </Text>
                <View className="relative">
                  <View className="absolute left-5 top-[18px] z-10">
                    <Ionicons name="call-outline" size={20} color="#9ca3af" />
                  </View>
                  <TextInput
                    className={`w-full bg-white/5 border rounded-2xl py-5 pl-14 pr-4 text-white text-lg font-semibold ${error ? 'border-red-500' : 'border-white/10'}`}
                    placeholder="+91 2345678901"
                    placeholderTextColor="#4b5563"
                    value={phone}
                    onChangeText={(val) => {
                      setPhone(val);
                      if (error) setError(null);
                    }}
                    keyboardType="phone-pad"
                  />
                </View>
                {error && <Text className="text-red-400 text-xs mt-1 ml-1 font-medium">{error}</Text>}
              </View>

              {/* Send OTP Button */}
              <TouchableOpacity
                onPress={handleSendOtp}
                disabled={loading}
                activeOpacity={0.8}
                className="w-full rounded-2xl overflow-hidden shadow-xl"
                style={{
                  elevation: 10,
                }}
              >
                <View 
                  className="py-5 flex-row items-center justify-center bg-purple-600"
                  style={{ backgroundColor: "#9333ea" }}
                >
                  <Text className="text-white font-bold text-xl tracking-tight">
                    {loading ? "Sending..." : "Get OTP Code"}
                  </Text>
                  {!loading && (
                    <View className="ml-2 bg-white/20 rounded-full p-1">
                      <Ionicons name="arrow-forward" size={18} color="white" />
                    </View>
                  )}
                  {loading && <ActivityIndicator color="white" className="ml-3" size="small" />}
                </View>
              </TouchableOpacity>
            </Animated.View>

            <View className="mt-12 mb-8 items-center">
              <Text className="text-[10px] text-gray-500 text-center uppercase tracking-widest leading-4 px-10">
                By continuing, you agree to our{"\n"}
                <Text className="text-purple-400/80 font-bold">Terms of Service</Text> and <Text className="text-purple-400/80 font-bold">Privacy Policy</Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AnimatedBackground>
  );
}
