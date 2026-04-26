import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import Animated, { FadeInDown } from "react-native-reanimated";
import Ionicons from "react-native-vector-icons/Ionicons";
import { firebaseLogin } from "../api/authService";
import { useAuth } from "../context/AuthContext";
import AnimatedBackground from "../components/AnimatedBackground";

export default function OtpVerifyScreen({ route, navigation }) {
  const { phone } = route.params;
  const { login, confirmation } = useAuth();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleVerifyOtp = async () => {
    if (otp.length < 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }


    if (!confirmation) {
      Alert.alert("Error", "Session expired. Please request a new OTP.");
      navigation.navigate("Login");
      return;
    }

    setLoading(true);
    try {
      // 1. Verify with Native Firebase
      console.log("[OTP] Confirming code:", otp);
      const userCredential = await confirmation.confirm(otp);
      const firebaseUser = userCredential.user;
      const idToken = await firebaseUser.getIdToken();

      // 2. Login with Backend using Firebase ID Token and phone
      console.log("[OTP] Exchange ID Token with backend");
      const response = await firebaseLogin({ idToken, phone });
      const { token, user } = response.data.data;
      
      await login(token, user);
      // Navigation state in AppNavigator will handle redirect
    } catch (error) {
      console.error("[OTP] Verify Error:", error);
      let errorMessage = "Failed to verify code. Please check and try again.";
      
      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = "The code you entered is invalid. Check the 6-digit code sent to your phone.";
      } else if (error.code === 'auth/session-expired') {
        errorMessage = "Your verification session has expired. Please request a new code.";
        navigation.navigate("Login");
      } else if (error.response?.status === 400 || error.response?.status === 401) {
        errorMessage = error.response?.data?.message || "Phone verification failed. Please try again.";
      } else if (error.message === "Network Error") {
        errorMessage = "Network error. Please check your connection.";
      }
      
      Alert.alert("Verification Failed", errorMessage);
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
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate("Login")}
            className="mt-14 w-12 h-12 rounded-2xl bg-white/5 items-center justify-center border border-white/10"
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>

          <View className="flex-1 justify-center -mt-16">
            <Animated.View 
              entering={FadeInDown.delay(200).duration(800)} 
              className="items-center mb-12"
            >
              <View className="w-24 h-24 rounded-[30px] bg-purple-500/10 items-center justify-center mb-6 border border-purple-500/20 shadow-2xl">
                <Ionicons name="shield-checkmark" size={48} color="#c084fc" />
              </View>
              <Text className="text-4xl font-extrabold text-white mb-3">Verification</Text>
              <View className="flex-row items-center bg-white/5 px-4 py-2 rounded-full border border-white/10">
                <Text className="text-gray-400 text-sm">Sent to </Text>
                <Text className="text-purple-300 font-bold text-sm tracking-widest">{phone}</Text>
              </View>
            </Animated.View>

            <Animated.View 
              entering={FadeInDown.delay(400).duration(800)}
              className="bg-white/5 border border-white/10 rounded-[40px] p-8 shadow-2xl backdrop-blur-xl"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}
            >
              <View className="space-y-4 mb-8">
                <Text className="text-xs font-semibold text-purple-300 uppercase tracking-widest ml-1">
                  Enter 6-Digit Code
                </Text>
                <View className="relative">
                  <View className="absolute left-5 top-[18px] z-10">
                    <Ionicons name="key-outline" size={20} color="#9ca3af" />
                  </View>
                  <TextInput
                    className={`w-full bg-white/5 border rounded-2xl py-5 pl-14 pr-4 text-white text-3xl font-bold tracking-[12px] text-center ${error ? 'border-red-500' : 'border-white/10'}`}
                    placeholder="000000"
                    placeholderTextColor="#4b5563"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={otp}
                    onChangeText={(val) => {
                      setOtp(val);
                      if (error) setError(null);
                    }}
                  />
                </View>
                {error && <Text className="text-red-400 text-xs mt-1 ml-1 font-medium text-center">{error}</Text>}
              </View>

              <TouchableOpacity
                onPress={handleVerifyOtp}
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
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Text className="text-white font-bold text-xl tracking-tight mr-2">Verify & Login</Text>
                      <View className="bg-white/20 rounded-full p-1">
                        <Ionicons name="checkmark-circle" size={18} color="white" />
                      </View>
                    </>
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                className="items-center mt-8"
                onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate("Login")}
              >
                <View className="flex-row items-center">
                  <Text className="text-gray-400 text-sm">Didn't receive code? </Text>
                  <Text className="text-purple-400 font-bold text-sm">Resend OTP</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>
          
          <View className="mb-10 items-center">
            <Text className="text-[10px] text-gray-500 text-center uppercase tracking-widest leading-4 opacity-50">
              Secured by EventBuddy Auth System
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AnimatedBackground>
  );
}
