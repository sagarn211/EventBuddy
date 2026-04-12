import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { register } from "../api/authService";
import AnimatedBackground from "../components/AnimatedBackground";

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    let newErrors = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }
    if (!phone.trim()) {
      newErrors.phone = "Phone is required";
    } else if (phone.length < 10) {
      newErrors.phone = "Phone must be at least 10 digits";
    }
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await register({ name, email, phone, password });
      if (response.data.success) {
        Alert.alert("Success", "Account created successfully! Please login.", [
          { text: "Login", onPress: () => navigation.navigate("Login") },
        ]);
      } else {
        Alert.alert("Registration Failed", response.data.message || "Something went wrong");
      }
    } catch (error) {
      console.error(error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatedBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6">
          <Animated.View
            entering={FadeInDown.delay(200).duration(800)}
            className="pt-16 mb-10 items-center"
          >
            <Text className="text-4xl font-bold text-white mb-2">
              Create <Text className="text-purple-400">Account</Text>
            </Text>
            <Text className="text-gray-400 text-sm">
              Start your journey with us today
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(400).duration(800)}
            className="bg-navy-900/50 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5"
            style={{ backgroundColor: "rgba(16, 17, 46, 0.5)" }}
          >
            {/* Full Name Field */}
            <View className="space-y-2">
              <Text className="text-sm font-medium text-gray-300 ml-1">Full Name</Text>
              <View className="relative">
                <View className="absolute left-4 top-3.5 z-10">
                  <Ionicons name="person-outline" size={20} color="#6b7280" />
                </View>
                <TextInput
                  className="w-full bg-navy-800/50 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white"
                  placeholder="John Doe"
                  placeholderTextColor="#4b5563"
                  value={name}
                  onChangeText={(val) => {
                    setName(val);
                    if (errors.name) setErrors({...errors, name: null});
                  }}
                />
              </View>
              {errors.name && <Text className="text-red-400 text-xs ml-1">{errors.name}</Text>}
            </View>

            {/* Email Field */}
            <View className="space-y-2">
              <Text className="text-sm font-medium text-gray-300 ml-1">Email</Text>
              <View className="relative">
                <View className="absolute left-4 top-3.5 z-10">
                  <Ionicons name="mail-outline" size={20} color="#6b7280" />
                </View>
                <TextInput
                  className="w-full bg-navy-800/50 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white"
                  placeholder="your@email.com"
                  placeholderTextColor="#4b5563"
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    if (errors.email) setErrors({...errors, email: null});
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              {errors.email && <Text className="text-red-400 text-xs ml-1">{errors.email}</Text>}
            </View>

            {/* Phone Field */}
            <View className="space-y-2">
              <Text className="text-sm font-medium text-gray-300 ml-1">Phone Number</Text>
              <View className="relative">
                <View className="absolute left-4 top-3.5 z-10">
                  <Ionicons name="call-outline" size={20} color="#6b7280" />
                </View>
                <TextInput
                  className="w-full bg-navy-800/50 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white"
                  placeholder="+1 (555) 000-0000"
                  placeholderTextColor="#4b5563"
                  value={phone}
                  onChangeText={(val) => {
                    setPhone(val);
                    if (errors.phone) setErrors({...errors, phone: null});
                  }}
                  keyboardType="phone-pad"
                />
              </View>
              {errors.phone && <Text className="text-red-400 text-xs ml-1">{errors.phone}</Text>}
            </View>

            {/* Password Field */}
            <View className="space-y-2">
              <Text className="text-sm font-medium text-gray-300 ml-1">Password</Text>
              <View className="relative">
                <View className="absolute left-4 top-3.5 z-10">
                  <Ionicons name="lock-closed-outline" size={20} color="#6b7280" />
                </View>
                <TextInput
                  className="w-full bg-navy-800/50 border border-white/10 rounded-2xl py-3.5 pl-12 pr-12 text-white"
                  placeholder="••••••••"
                  placeholderTextColor="#4b5563"
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    if (errors.password) setErrors({...errors, password: null});
                  }}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5"
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#6b7280"
                  />
                </TouchableOpacity>
              </View>
              {errors.password && <Text className="text-red-400 text-xs ml-1">{errors.password}</Text>}
            </View>

            {/* Register Button */}
            <TouchableOpacity
              onPress={handleRegister}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl py-4 flex-row items-center justify-center space-x-2 shadow-lg mt-4"
              style={{
                backgroundColor: "#9333ea",
                elevation: 8,
              }}
            >
              <Text className="text-white font-bold text-lg">
                {loading ? "Creating Account..." : "Sign Up"}
              </Text>
              {!loading && (
                <Ionicons name="rocket-outline" size={20} color="white" />
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View className="flex-row justify-center pt-2">
              <Text className="text-gray-400 text-sm">Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text className="text-purple-400 font-bold text-sm">Login</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          <View className="mt-8 mb-10 items-center">
            <Text className="text-xs text-gray-500 text-center px-4">
              By joining, you agree to our{" "}
              <Text className="text-blue-400 underline">Terms of Service</Text> and{" "}
              <Text className="text-blue-400 underline">Privacy Policy</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AnimatedBackground>
  );
}
