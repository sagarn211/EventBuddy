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
import Animated, { FadeInDown, FadeInUp, Layout } from "react-native-reanimated";
import Ionicons from "react-native-vector-icons/Ionicons";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import ImagePicker from "react-native-image-crop-picker";
import LinearGradient from "react-native-linear-gradient";
import AnimatedBackground from "../components/AnimatedBackground";
import { updateProfile } from "../api/userService";
import { uploadFile } from "../api/uploadService";
import { useAuth } from "../context/AuthContext";
import appConfig from "../config/appConfig";




const INTERESTS = [
  { id: "movies", label: "Movies", icon: "film", color: "#818cf8", bg: "rgba(99, 102, 241, 0.2)" },
  { id: "music", label: "Music", icon: "music", color: "#f472b6", bg: "rgba(244, 114, 182, 0.2)" },
  { id: "tech", label: "Tech", icon: "laptop-code", color: "#60a5fa", bg: "rgba(96, 165, 250, 0.2)" },
  { id: "food", label: "Food", icon: "utensils", color: "#fb923c", bg: "rgba(251, 146, 60, 0.2)" },
  { id: "sports", label: "Sports", icon: "futbol", color: "#4ade80", bg: "rgba(74, 222, 128, 0.2)" },
  { id: "travel", label: "Travel", icon: "plane", color: "#22d3ee", bg: "rgba(34, 211, 238, 0.2)" },
  { id: "art", label: "Art", icon: "palette", color: "#818cf8", bg: "rgba(99, 102, 241, 0.2)" },
  { id: "gaming", label: "Gaming", icon: "gamepad", color: "#f472b6", bg: "rgba(244, 114, 182, 0.2)" },
  { id: "reading", label: "Reading", icon: "book", color: "#60a5fa", bg: "rgba(96, 165, 250, 0.2)" },
  { id: "fitness", label: "Fitness", icon: "dumbbell", color: "#4ade80", bg: "rgba(74, 222, 128, 0.2)" },
  { id: "photo", label: "Photo", icon: "camera", color: "#facc15", bg: "rgba(250, 204, 21, 0.2)" },
  { id: "fashion", label: "Fashion", icon: "tshirt", color: "#f472b6", bg: "rgba(244, 114, 182, 0.2)" },
];

export default function ProfileSetupScreen({ route, navigation }) {
  const { updateUser, logout, user } = useAuth();

  const editUser = route.params?.user;

  const [name, setName] = useState(editUser?.name || "");
  const [age, setAge] = useState(editUser?.age?.toString() || "");
  const [location, setLocation] = useState(editUser?.city || "");
  const [bio, setBio] = useState(editUser?.bio || "");
  const [avatar, setAvatar] = useState(editUser?.avatar || null);
  const [selectedInterests, setSelectedInterests] = useState(editUser?.interests || []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editUser) {
      setName(editUser.name || "");
      setAge(editUser.age?.toString() || "");
      setLocation(editUser.city || "");
      setBio(editUser.bio || "");
      setAvatar(editUser.avatar || null);
      setSelectedInterests(editUser.interests || []);
    }
    // Removed automatic location detection to avoid java.lang.IllegalStateException
    // Users can manually click "Detect" button if desired
  }, [editUser]);

  const pickImage = async () => {
    try {
      const image = await ImagePicker.openPicker({
        width: 300,
        height: 300,
        cropping: true,
        includeBase64: false,
        mediaType: "photo",
      });
      setAvatar(image.path);
    } catch (error) {
      if (error.message !== "User cancelled image selection") {
        console.error(error);
        Alert.alert("Error", "Could not select image. Please try again.");
      }
    }
  };

  const toggleInterest = (id) => {
    if (selectedInterests.includes(id)) {
      setSelectedInterests(selectedInterests.filter((item) => item !== id));
    } else {
      setSelectedInterests([...selectedInterests, id]);
    }
  };



  const handleContinue = async () => {
    console.log("🔴 BUTTON CLICKED - handleContinue started");
    
    if (!name || !age || !bio) {
      console.log("❌ Missing required fields", { name, age, bio });
      Alert.alert("Required Fields", "Please fill in your name, age, and bio.");
      return;
    }

    console.log("✅ All fields present, starting save...");
    setLoading(true);
    let timeoutId;

    try {
      console.log("🟡 1. Preparing data");
      
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          console.log("❌ TIMEOUT - API took too long");
          reject(new Error("Profile update timed out. Please check your connection and try again."));
        }, 30000);
      });

      let finalAvatarUrl = avatar;

      // Step 1: Handle avatar
      if (avatar && avatar.startsWith('file://')) {
        try {
          console.log("🟡 2. Uploading avatar");
          const fileName = `pfp-${user._id}-${Date.now()}.jpg`;
          const uploadRes = await uploadFile(avatar, fileName, 'image/jpeg', 'profiles');
          
          if (uploadRes.data?.success) {
            finalAvatarUrl = uploadRes.data.data.url;
            console.log("✅ Avatar uploaded");
          } else {
            finalAvatarUrl = avatar;
          }
        } catch (uploadError) {
          console.error("⚠️ Avatar upload failed:", uploadError.message);
        }
      } else {
        console.log("ℹ️ No new avatar to upload");
      }

      // Step 2: Call API
      console.log("🟡 3. Calling updateProfile API");
      console.log("Payload:", { name, age, bio, city: location, interests: selectedInterests });

      const response = await Promise.race([
        updateProfile({
          name,
          age: parseInt(age),
          bio,
          city: location || "",
          avatar: finalAvatarUrl,
          interests: selectedInterests,
          isProfileComplete: true,
        }),
        timeoutPromise
      ]);

      clearTimeout(timeoutId);
      console.log("✅ API Response:", response.data);

      // Update context
      if (response.data?.data) {
        console.log("🟡 4. Updating local context");
        await updateUser(response.data.data);
        console.log("✅ Context updated");
      }
      
      setLoading(false);
      console.log("🟡 5. Showing success alert");
      
      // Show alert immediately
      setTimeout(() => {
        if (editUser) {
          console.log("🟢 EDIT MODE - showing edit success");
          Alert.alert("Success! ✨", "Your profile has been updated successfully!", [
            {
              text: "Done",
              onPress: () => {
                console.log("Going back");
                navigation.goBack();
              },
            },
          ]);
        } else {
          console.log("🟢 CREATE MODE - showing create success");
          Alert.alert("Success! 🎉", "Your profile has been created. Welcome to EventBuddy!", [
            {
              text: "Explore",
              onPress: () => {
                console.log("Navigating to Main");
                navigation.reset({
                  index: 0,
                  routes: [{ name: "Main" }],
                });
              },
            },
          ]);
        }
      }, 100);

    } catch (error) {
      clearTimeout(timeoutId);
      setLoading(false);
      console.log("❌ CATCH ERROR:", error.message);
      console.log("Full error:", error);
      
      setTimeout(() => {
        Alert.alert(
          "Profile Update Failed",
          error?.message || "Could not save your profile. Please try again.",
          [{ text: "OK" }]
        );
      }, 100);
    }
  };

  return (
    <AnimatedBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1 }} 
          className="px-6"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mt-14 mb-4">
            <TouchableOpacity
              onPress={() => navigation.canGoBack() ? navigation.goBack() : logout()}
              className="w-10 h-10 rounded-xl bg-white/5 items-center justify-center border border-white/10"
            >
              <Ionicons name="arrow-back" size={24} color="#d1d5db" />
            </TouchableOpacity>
          </View>


          {/* Title Section */}
          <Animated.View entering={FadeInDown.delay(200)} className="mb-8">
            <Text className="text-4xl font-bold text-white mb-2">
              {editUser ? 'Edit Your' : 'Create Your'} <Text className="text-indigo-400">Profile</Text>
            </Text>
            <Text className="text-gray-400 text-sm">{editUser ? 'Keep your profile fresh! ✨' : "Let's make you stand out! ✨"}</Text>
          </Animated.View>

          {/* Avatar Section */}
          <Animated.View entering={FadeInDown.delay(300)} className="items-center mb-8">
            <TouchableOpacity 
              onPress={pickImage}
              className="relative"
              activeOpacity={0.9}
            >
              <View className="w-36 h-36 rounded-full glass-card border border-white/10 overflow-hidden" style={Platform.OS === 'ios' ? {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              } : {
                elevation: 8,
              }}>
                {avatar ? (
                  <Image source={{ uri: avatar }} className="w-full h-full object-cover" />
                ) : (
                  <Image 
                    source={{ uri: appConfig.defaultAvatar }} 
                    className="w-full h-full object-cover" 
                  />

                )}
                <View className="absolute inset-0 bg-black/40 items-center justify-center">
                   <Ionicons name="camera" size={32} color="white" />
                   <Text className="text-[10px] text-white font-medium mt-1">Change Photo</Text>
                </View>
              </View>
              <View className="absolute bottom-0 right-0 w-12 h-12 bg-indigo-600 rounded-full items-center justify-center border-4 border-[#0a0a1a]">
                <Ionicons name="add" size={24} color="white" />
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Form Fields */}
          <Animated.View entering={FadeInDown.delay(400)} className="space-y-6">
            <View className="space-y-2">
              <Text className="text-sm font-medium text-gray-300 ml-1">Full Name</Text>
              <View className="relative">
                <View className="absolute left-4 top-[14px] z-10">
                  <Ionicons name="person-outline" size={20} color="#6b7280" />
                </View>
                <TextInput
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white"
                  placeholder="Enter your name"
                  placeholderTextColor="#4b5563"
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            <View className="space-y-2">
              <Text className="text-sm font-medium text-gray-300 ml-1">Age</Text>
              <View className="relative">
                <View className="absolute left-4 top-[14px] z-10">
                   <MaterialCommunityIcons name="cake-variant-outline" size={20} color="#6b7280" />
                </View>
                <TextInput
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white"
                  placeholder="18"
                  placeholderTextColor="#4b5563"
                  keyboardType="numeric"
                  value={age}
                  onChangeText={setAge}
                />
              </View>
            </View>

            <View className="space-y-2">
              <Text className="text-sm font-medium text-gray-300 ml-1">Location</Text>
              <View className="relative">
                <View className="absolute left-4 top-[14px] z-10">
                   <Ionicons name="location-outline" size={20} color="#6b7280" />
                </View>
                <TextInput
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white"
                  placeholder="e.g. Los Angeles, CA"
                  placeholderTextColor="#4b5563"
                  value={location}
                  onChangeText={setLocation}
                />
              </View>
            </View>

            <View className="space-y-2">
              <Text className="text-sm font-medium text-gray-300 ml-1">Bio</Text>
              <View className="relative">
                <View className="absolute left-4 top-[14px] z-10">
                  <MaterialCommunityIcons name="pencil-outline" size={20} color="#6b7280" />
                </View>
                <TextInput
                  className="w-full bg-gray-800 border border-gray-700 rounded-2xl py-3.5 pl-12 pr-4 text-white min-h-[120px]"
                  placeholder="Tell us about yourself..."
                  placeholderTextColor="#4b5563"
                  multiline
                  maxLength={150}
                  textAlignVertical="top"
                  value={bio}
                  onChangeText={setBio}
                />
                <TouchableOpacity className="absolute top-4 right-4">
                  <MaterialCommunityIcons name="arrow-expand" size={20} color="white" />
                </TouchableOpacity>
                <View className="absolute bottom-2 right-4">
                  <Text className={`text-[10px] ${bio.length > 140 ? 'text-pink-500' : 'text-gray-500'}`}>
                    {bio.length}/150
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Interests Section */}
          <Animated.View entering={FadeInDown.delay(500)} className="mt-8">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-sm font-medium text-gray-300 ml-1">Interests</Text>
              <Text className="text-xs text-gray-500">Select all that apply</Text>
            </View>

            <View className="flex-row flex-wrap -mx-2">
              {INTERESTS.map((interest) => {
                const isSelected = selectedInterests.includes(interest.id);
                return (
                  <View key={interest.id} className="w-1/2 px-2 pb-4">
                    <TouchableOpacity
                      onPress={() => toggleInterest(interest.id)}
                      activeOpacity={0.7}
                      className={`flex-row items-center p-3 rounded-2xl border ${
                        isSelected ? 'bg-indigo-600/20 border-indigo-500' : 'bg-gray-800 border-gray-700'
                      }`}
                      style={{ height: 75 }}
                    >
                      <View 
                        className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                        style={{ backgroundColor: isSelected ? 'rgba(99,102,241,0.3)' : interest.bg }}
                      >
                        <FontAwesome5 name={interest.icon} size={16} color={isSelected ? 'white' : interest.color} />
                      </View>
                      <Text className={`font-semibold text-base ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                        {interest.label}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </Animated.View>

          {/* CTA Section */}
          <Animated.View entering={FadeInDown.delay(600)} className="mt-12 mb-10">
            <TouchableOpacity
              onPress={handleContinue}
              disabled={loading}
              activeOpacity={0.8}
              className="w-full rounded-[20px] overflow-hidden"
              style={Platform.OS === 'ios' ? {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 10,
              } : {
                elevation: 8,
              }}
            >
              <LinearGradient
                colors={['#a855f7', '#3b82f6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="py-4 flex-row items-center justify-center"
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Text className="text-white font-bold text-xl mr-2">{editUser ? 'Save Changes' : 'Continue'}</Text>
                    <Text className="text-2xl">🚀</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
            
            {/* Help Button Floating-style */}
            <View className="flex-row items-center justify-between mt-6">
              <Text className="text-[10px] text-gray-500 uppercase tracking-widest flex-1">
                You can always change this later in settings
              </Text>
              <TouchableOpacity className="bg-purple-600 rounded-full px-4 py-2 flex-row items-center">
                <Ionicons name="help-circle" size={16} color="white" />
                <Text className="text-white font-bold ml-1">Help</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AnimatedBackground>
  );
}
