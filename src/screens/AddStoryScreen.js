import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  
  Image,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Modal,
  Platform,
  PermissionsAndroid,
  Alert,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { launchImageLibrary, launchCamera } from "react-native-image-picker";
import { useAuth } from "../context/AuthContext";
import { getContacts } from "../api/userService";
import { saveStoryToBackend } from "../api/storyService";
import { uploadFile } from "../api/uploadService";
import appConfig from "../config/appConfig";




// Permission Request Helper
const requestCameraPermission = async () => {
  if (Platform.OS === "ios") {
    return true; // iOS handles permissions through Info.plist
  }

  try {
    const permission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: "Camera Permission",
        message: "This app needs camera permission to take photos/videos",
        buttonNeutral: "Ask Me Later",
        buttonNegative: "Cancel",
        buttonPositive: "OK",
      }
    );
    return permission === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.error("Camera permission error:", err);
    return false;
  }
};

const requestPhotoPermission = async () => {
  if (Platform.OS === "ios") {
    return true; // iOS handles permissions through Info.plist
  }

  try {
    const permission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      {
        title: "Photo Permission",
        message: "This app needs permission to access your photos",
        buttonNeutral: "Ask Me Later",
        buttonNegative: "Cancel",
        buttonPositive: "OK",
      }
    );
    return permission === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.error("Photo permission error:", err);
    return false;
  }
};

// Photo Story Component
const PhotoComponent = ({ onImageSelected }) => {
  const [photoUri, setPhotoUri] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickPhoto = async () => {
    try {
      setError(null);
      setLoading(true);
      console.log("pickPhoto called");

      const hasPermission = await requestPhotoPermission();
      console.log("Photo permission granted:", hasPermission);

      if (!hasPermission) {
        Alert.alert("Permission Denied", "Please grant photo library permission in settings");
        setLoading(false);
        return;
      }

      launchImageLibrary(
        {
          mediaType: "photo",
          quality: 0.8,
        },
        (response) => {
          setLoading(false);
          console.log("pickPhoto response:", response);

          if (response.didCancel) {
            console.log("User cancelled photo picker");
          } else if (response.errorCode) {
            const errorMsg = response.errorMessage || "Failed to pick photo";
            console.error("Photo picker error:", errorMsg);
            setError(errorMsg);
            Alert.alert("Error", errorMsg);
          } else if (response.assets && response.assets.length > 0) {
            const asset = response.assets[0];
            const uri = asset.uri;
            console.log("Photo selected:", uri);
            setPhotoUri(uri);
            onImageSelected({
                uri: uri,
                name: asset.fileName,
                type: asset.type
            });

          }
        }
      );
    } catch (err) {
      setLoading(false);
      console.error("pickPhoto error:", err);
      setError(err.message);
      Alert.alert("Error", err.message);
    }
  };

  const capturePhoto = async () => {
    try {
      setError(null);
      setLoading(true);
      console.log("capturePhoto called");

      const hasPermission = await requestCameraPermission();
      console.log("Camera permission granted:", hasPermission);

      if (!hasPermission) {
        Alert.alert("Permission Denied", "Please grant camera permission in settings");
        setLoading(false);
        return;
      }

      launchCamera(
        {
          mediaType: "photo",
          quality: 0.8,
        },
        (response) => {
          setLoading(false);
          console.log("capturePhoto response:", response);

          if (response.didCancel) {
            console.log("User cancelled camera");
          } else if (response.errorCode) {
            const errorMsg = response.errorMessage || "Failed to take photo";
            console.error("Camera error:", errorMsg);
            setError(errorMsg);
            Alert.alert("Error", errorMsg);
          } else if (response.assets && response.assets.length > 0) {
            const asset = response.assets[0];
            const uri = asset.uri;
            console.log("Photo captured:", uri);
            setPhotoUri(uri);
            onImageSelected({
                uri: uri,
                name: asset.fileName,
                type: asset.type
            });

          }
        }
      );
    } catch (err) {
      setLoading(false);
      console.error("capturePhoto error:", err);
      setError(err.message);
      Alert.alert("Error", err.message);
    }
  };

  if (photoUri) {
    return (
      <View className="px-6 py-6 bg-[#111114]">
        <View className="items-center justify-between gap-4">
          <Image
            source={{ uri: photoUri }}
            className="w-full h-96 rounded-lg"
            resizeMode="cover"
          />
          <TouchableOpacity
            onPress={() => setPhotoUri(null)}
            className="w-full bg-gray-700 py-3 px-4 rounded-lg flex-row items-center justify-center gap-2"
          >
            <Ionicons name="refresh" size={18} color="white" />
            <Text className="text-white font-semibold">Change Photo</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="px-6 py-6 bg-[#111114] min-h-screen">
      {loading && (
        <View className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
          <ActivityIndicator size="large" color="#a855f7" />
        </View>
      )}
      <View className="items-center justify-center gap-6 pt-10">
        <View className="w-24 h-24 rounded-full bg-purple-600/20 items-center justify-center">
          <Ionicons name="image" size={48} color="#a78bfa" />
        </View>
        <Text className="text-white text-xl font-semibold text-center">Add a Photo</Text>
        <Text className="text-gray-400 text-center text-sm px-2">
          Choose from your gallery or take a new photo
        </Text>
        {error && (
          <Text className="text-red-500 text-xs text-center px-2">{error}</Text>
        )}
        <TouchableOpacity
          onPress={pickPhoto}
          disabled={loading}
          className="w-full bg-purple-600 py-4 rounded-lg items-center mt-6"
          activeOpacity={0.7}
        >
          <View className="flex-row items-center gap-2">
            <Ionicons name="images" size={20} color="white" />
            <Text className="text-white font-semibold">Pick from Gallery</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={capturePhoto}
          disabled={loading}
          className="w-full bg-blue-600 py-4 rounded-lg items-center"
          activeOpacity={0.7}
        >
          <View className="flex-row items-center gap-2">
            <Ionicons name="camera" size={20} color="white" />
            <Text className="text-white font-semibold">Take Photo</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Video Story Component
const VideoComponent = ({ onVideoSelected }) => {
  const [videoUri, setVideoUri] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickVideo = async () => {
    try {
      setError(null);
      setLoading(true);
      console.log("pickVideo called");

      const hasPermission = await requestPhotoPermission();
      console.log("Photo permission granted:", hasPermission);

      if (!hasPermission) {
        Alert.alert("Permission Denied", "Please grant photo library permission in settings");
        setLoading(false);
        return;
      }

      launchImageLibrary(
        {
          mediaType: "video",
          quality: 0.8,
          durationLimit: 30,
        },
        (response) => {
          setLoading(false);
          console.log("pickVideo response:", response);

          if (response.didCancel) {
            console.log("User cancelled video picker");
          } else if (response.errorCode) {
            const errorMsg = response.errorMessage || "Failed to pick video";
            console.error("Video picker error:", errorMsg);
            setError(errorMsg);
            Alert.alert("Error", errorMsg);
          } else if (response.assets && response.assets.length > 0) {
            const asset = response.assets[0];
            const uri = asset.uri;
            console.log("Video selected:", uri);
            setVideoUri(uri);
            onVideoSelected({
                uri: uri,
                name: asset.fileName,
                type: asset.type
            });

          }
        }
      );
    } catch (err) {
      setLoading(false);
      console.error("pickVideo error:", err);
      setError(err.message);
      Alert.alert("Error", err.message);
    }
  };

  const captureVideo = async () => {
    try {
      setError(null);
      setLoading(true);
      console.log("captureVideo called");

      const hasPermission = await requestCameraPermission();
      console.log("Camera permission granted:", hasPermission);

      if (!hasPermission) {
        Alert.alert("Permission Denied", "Please grant camera permission in settings");
        setLoading(false);
        return;
      }

      launchCamera(
        {
          mediaType: "video",
          quality: 0.8,
          durationLimit: 30,
        },
        (response) => {
          setLoading(false);
          console.log("captureVideo response:", response);

          if (response.didCancel) {
            console.log("User cancelled camera");
          } else if (response.errorCode) {
            const errorMsg = response.errorMessage || "Failed to record video";
            console.error("Camera error:", errorMsg);
            setError(errorMsg);
            Alert.alert("Error", errorMsg);
          } else if (response.assets && response.assets.length > 0) {
            const asset = response.assets[0];
            const uri = asset.uri;
            console.log("Video captured:", uri);
            setVideoUri(uri);
            onVideoSelected({
                uri: uri,
                name: asset.fileName,
                type: asset.type
            });

          }
        }
      );
    } catch (err) {
      setLoading(false);
      console.error("captureVideo error:", err);
      setError(err.message);
      Alert.alert("Error", err.message);
    }
  };

  if (videoUri) {
    return (
      <View className="px-6 py-6 bg-[#111114]">
        <View className="items-center justify-between gap-4">
          <View className="w-full h-96 bg-black rounded-lg flex items-center justify-center">
            <Ionicons name="play-circle" size={64} color="white" />
            <Text className="text-white text-sm mt-2 font-semibold">Video Selected</Text>
          </View>
          <TouchableOpacity
            onPress={() => setVideoUri(null)}
            className="w-full bg-gray-700 py-3 px-4 rounded-lg flex-row items-center justify-center gap-2"
          >
            <Ionicons name="refresh" size={18} color="white" />
            <Text className="text-white font-semibold">Change Video</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="px-6 py-6 bg-[#111114] min-h-screen">
      {loading && (
        <View className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
          <ActivityIndicator size="large" color="#a855f7" />
        </View>
      )}
      <View className="items-center justify-center gap-6 pt-10">
        <View className="w-24 h-24 rounded-full bg-orange-600/20 items-center justify-center">
          <Ionicons name="videocam" size={48} color="#fb923c" />
        </View>
        <Text className="text-white text-xl font-semibold text-center">Add a Video</Text>
        <Text className="text-gray-400 text-center text-sm px-2">
          Max 30 seconds | Recommended ratio 9:16
        </Text>
        {error && (
          <Text className="text-red-500 text-xs text-center px-2">{error}</Text>
        )}
        <TouchableOpacity
          onPress={pickVideo}
          disabled={loading}
          className="w-full bg-orange-600 py-4 rounded-lg items-center mt-6"
          activeOpacity={0.7}
        >
          <View className="flex-row items-center gap-2">
            <Ionicons name="videocam" size={20} color="white" />
            <Text className="text-white font-semibold">Pick from Gallery</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={captureVideo}
          disabled={loading}
          className="w-full bg-red-600 py-4 rounded-lg items-center"
          activeOpacity={0.7}
        >
          <View className="flex-row items-center gap-2">
            <Ionicons name="videocam" size={20} color="white" />
            <Text className="text-white font-semibold">Record Video</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const AddStoryScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [storyText, setStoryText] = useState("");
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [storyType, setStoryType] = useState("text"); // text, photo, video
  const [isPosting, setIsPosting] = useState(false);
  const [media, setMedia] = useState(null); // Store selected image/video URI

  useFocusEffect(
    useCallback(() => {
      const fetchContacts = async () => {
        try {
          setLoading(true);
          const response = await getContacts();
          const contactsList = response.data?.data || [];
          setContacts(contactsList);
        } catch (error) {
          console.error("Error fetching contacts:", error);
          setContacts([]);
        } finally {
          setLoading(false);
        }
      };
      fetchContacts();
    }, [user?._id])
  );

  const toggleContactSelection = (contact) => {
    const isSelected = selectedContacts.find(c => c._id === contact._id);
    if (isSelected) {
      setSelectedContacts(selectedContacts.filter(c => c._id !== contact._id));
    } else {
      setSelectedContacts([...selectedContacts, contact]);
    }
  };

  const handlePostStory = async () => {
    if (!storyText && !media && storyType === "text") {
      Alert.alert("Error", "Please add some content to your story");
      return;
    }

    setIsPosting(true);
    
    try {
      let mediaUrl = "";
      let mediaId = "";

      // Step 1: Upload media if exists
      if (media && (storyType === "photo" || storyType === "video")) {
        const uploadRes = await uploadFile(media.uri, media.name, media.type, "stories");
        if (uploadRes.data?.success) {
          mediaUrl = uploadRes.data.data.url;
          mediaId = uploadRes.data.data.fileId;
        } else {
          throw new Error("Failed to upload media to cloud");
        }
      }

      // Step 2: Save story to backend
      const storyData = {
        type: storyType,
        text: storyText,
        media: mediaUrl,
        mediaId: mediaId,
        visibility: selectedContacts.length === 0 ? "public" : "private",
        selectedContacts: selectedContacts.map(c => c._id),
      };

      await saveStoryToBackend(storyData);
      
      Alert.alert("Success", "Story posted to global feed!");

      setStoryText("");
      setMedia(null);
      setSelectedContacts([]);
      setStoryType("text");
      setIsPosting(false);
      navigation.goBack();
    } catch (error) {
      console.error("Error posting story:", error);
      Alert.alert("Error", "Failed to post story");
      setIsPosting(false);
    }
  };

  const storyOptions = [
    { id: "text", label: "Text Story", icon: "text", color: "from-purple-600 to-pink-600" },
    { id: "photo", label: "Photo", icon: "camera", color: "from-blue-600 to-cyan-600" },
    { id: "video", label: "Video", icon: "videocam", color: "from-orange-600 to-red-600" },
  ];

  return (
    <View className="flex-1 bg-[#111114]">
      {/* Ambient Glows (Stable) */}
      <View className="absolute top-[-5%] left-[-15%] w-72 h-72 bg-purple-600/[0.05] rounded-full" />
      <View className="absolute top-[30%] right-[-10%] w-64 h-64 bg-pink-600/[0.05] rounded-full" />

      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <View className="flex-row items-center justify-between mb-6">
            <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={28} color="#d1d5db" />
            </TouchableOpacity>
            <Text className="text-2xl font-extrabold text-white tracking-tight flex-1 ml-3">
              Add Your Story
            </Text>
            <TouchableOpacity
              onPress={handlePostStory}
              disabled={isPosting}
              className={`px-5 py-2 rounded-full ${isPosting ? "bg-gray-600" : "bg-gradient-to-r from-purple-600 to-pink-600"}`}
            >
              <Text className="text-xs font-bold text-white">
                {isPosting ? "POSTING..." : "SHARE"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {storyType === "photo" ? (
          <PhotoComponent onImageSelected={(uri) => setMedia(uri)} />
        ) : storyType === "video" ? (
          <VideoComponent onVideoSelected={(uri) => setMedia(uri)} />
        ) : (
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            {/* Story Type Selection */}
            <View className="px-6 mb-8">
              <Text className="text-sm font-bold text-gray-400 mb-3 uppercase">
                Choose Story Type
              </Text>
              <View className="flex-row gap-3">
                {storyOptions.map((option, index) => (
                  <Animated.View
                    key={option.id}
                    entering={FadeInDown.delay(index * 100).duration(500)}
                    className="flex-1"
                  >
                    <TouchableOpacity
                      onPress={() => setStoryType(option.id)}
                      activeOpacity={0.7}
                      className={`p-4 rounded-2xl border-2 flex items-center justify-center ${
                        storyType === option.id
                          ? "bg-gradient-to-br " + option.color + " border-transparent"
                          : "bg-[#1c1c24]/50 border-white/10"
                      }`}
                    >
                      <Ionicons
                        name={option.icon}
                        size={24}
                        color={storyType === option.id ? "white" : "#9ca3af"}
                      />
                      <Text
                        className={`text-xs font-bold mt-2 ${
                          storyType === option.id ? "text-white" : "text-gray-500"
                        }`}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            </View>

            {/* Text Story Input */}
            {storyType === "text" && (
              <Animated.View entering={FadeInDown.duration(500)} className="px-6 mb-8">
                <Text className="text-sm font-bold text-gray-400 mb-3 uppercase">
                  Your Story
                </Text>
                <View className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-600/50 rounded-3xl p-6">
                  <TextInput
                    placeholder="What's on your mind? Share your story..."
                    placeholderTextColor="#6b7280"
                    value={storyText}
                    onChangeText={setStoryText}
                    multiline
                    numberOfLines={8}
                    className="text-white font-medium text-base min-h-[180px]"
                    textAlignVertical="top"
                  />
                  <View className="mt-4 pt-4 border-t border-white/10 flex-row items-center justify-between">
                    <Text className="text-xs text-gray-500">
                      {storyText.length}/500 characters
                    </Text>
                    {storyText.length > 0 && (
                      <TouchableOpacity onPress={() => setStoryText("")}>
                        <Ionicons name="close-circle" size={18} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </Animated.View>
            )}

            {/* Visibility Settings */}
            <View className="px-6 mb-8">
              <Text className="text-sm font-bold text-gray-400 mb-3 uppercase">
                Share With
              </Text>
              <TouchableOpacity
                onPress={() => setShowContactsModal(true)}
                className="bg-[#1c1c24]/50 border border-purple-600/50 rounded-2xl p-4 flex-row items-center justify-between"
                activeOpacity={0.7}
              >
                <View className="flex-row items-center flex-1">
                  <Ionicons name="people" size={20} color="#a855f7" />
                  <View className="ml-3 flex-1">
                    <Text className="text-sm font-bold text-white">
                      {selectedContacts.length === 0
                        ? "Everyone"
                        : `${selectedContacts.length} friend${
                            selectedContacts.length !== 1 ? "s" : ""
                          }`}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {selectedContacts.length === 0
                        ? "Visible to all your contacts"
                        : "Share with selected friends"}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6b7280" />
              </TouchableOpacity>

              {/* Selected Contacts Display */}
              {selectedContacts.length > 0 && (
                <View className="mt-4">
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8 }}
                  >
                    {selectedContacts.map((contact) => (
                      <View
                        key={contact._id}
                        className="flex-row items-center bg-purple-600/30 border border-purple-500/50 rounded-full px-3 py-2"
                      >
                        <Image
                            source={{
                              uri: contact.avatar || appConfig.defaultAvatar,
                            }}
                          className="w-6 h-6 rounded-full mr-2"
                        />

                        <Text className="text-xs font-semibold text-white">
                          {(contact.firstName || contact.name).substring(0, 10)}
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Story Settings */}
            <View className="px-6 mb-8">
              <Text className="text-sm font-bold text-gray-400 mb-3 uppercase">
                Settings
              </Text>
              <TouchableOpacity className="bg-[#1c1c24]/50 border border-white/5 rounded-2xl p-4 flex-row items-center justify-between mb-2" activeOpacity={0.7}>
                <View className="flex-row items-center flex-1">
                  <Ionicons name="lock-closed" size={18} color="#9ca3af" />
                  <Text className="text-sm font-bold text-white ml-3 flex-1">
                    Allow Comments
                  </Text>
                </View>
                <View className="w-12 h-7 rounded-full bg-purple-600 flex items-center justify-end pr-1">
                  <View className="w-5 h-5 rounded-full bg-white" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity className="bg-[#1c1c24]/50 border border-white/5 rounded-2xl p-4 flex-row items-center justify-between" activeOpacity={0.7}>
                <View className="flex-row items-center flex-1">
                  <Ionicons name="time" size={18} color="#9ca3af" />
                  <Text className="text-sm font-bold text-white ml-3 flex-1">
                    Story Expiry: 24h
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* Contacts Selection Modal */}
        <Modal
          visible={showContactsModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowContactsModal(false)}
        >
          <View className="flex-1 bg-[#111114]">
            <SafeAreaView style={{ flex: 1 }}>
              {/* Modal Header */}
              <View className="px-6 pt-6 pb-4 flex-row items-center justify-between border-b border-white/5">
                <TouchableOpacity onPress={() => setShowContactsModal(false)}>
                  <Ionicons name="chevron-back" size={28} color="#d1d5db" />
                </TouchableOpacity>
                <Text className="text-lg font-extrabold text-white">
                  Select Friends
                </Text>
                <TouchableOpacity
                  onPress={() => setShowContactsModal(false)}
                  className="px-4 py-2 bg-purple-600 rounded-full"
                >
                  <Text className="text-xs font-bold text-white">Done</Text>
                </TouchableOpacity>
              </View>

              {/* Contacts List */}
              <ScrollView
                className="flex-1 px-4"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: 16 }}
              >
                {loading ? (
                  <ActivityIndicator size="large" color="#a855f7" />
                ) : contacts.length > 0 ? (
                  contacts.map((contact, index) => {
                    const isSelected = selectedContacts.find(c => c._id === contact._id);
                    return (
                      <TouchableOpacity
                        key={contact._id}
                        onPress={() => toggleContactSelection(contact)}
                        activeOpacity={0.7}
                        className={`flex-row items-center p-4 mb-2 rounded-2xl border ${
                          isSelected
                            ? "bg-purple-600/20 border-purple-500/50"
                            : "bg-[#1c1c24]/30 border-white/5"
                        }`}
                      >
                        <View className="w-12 h-12 rounded-full overflow-hidden mr-4 border-2 border-white/10">
                          <Image
                            source={{
                              uri: contact.avatar || appConfig.defaultAvatar,
                            }}
                            className="w-full h-full"
                          />

                        </View>
                        <View className="flex-1">
                          <Text className="text-base font-bold text-white">
                            {contact.firstName || contact.name}
                          </Text>
                          <Text className="text-xs text-gray-500">
                            {contact.email || "@user"}
                          </Text>
                        </View>
                        {isSelected && (
                          <View className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center">
                            <Ionicons name="checkmark" size={14} color="white" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <View className="items-center justify-center mt-20">
                    <Ionicons name="person-outline" size={48} color="#4b5563" />
                    <Text className="text-gray-500 mt-4 font-bold">
                      No contacts found
                    </Text>
                  </View>
                )}
              </ScrollView>
            </SafeAreaView>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
};

export default AddStoryScreen;
