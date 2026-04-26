import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LinearGradient from "react-native-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import Animated, { FadeInDown } from "react-native-reanimated";
import DateTimePicker from "@react-native-community/datetimepicker";
import { createPlan } from "../api/planService";
import { useAuth } from "../context/AuthContext";
import AnimatedBackground from "../components/AnimatedBackground";

const { width } = Dimensions.get("window");

const CATEGORIES = [
  { id: "movie", label: "Movie", emoji: "🎬", color: "#a855f7" },
  { id: "livemusic", label: "Live Music", emoji: "🎵", color: "#f97316" },
  { id: "foodcrawl", label: "Food Crawl", emoji: "🍽️", color: "#ef4444" },
  { id: "cafe", label: "Café", emoji: "☕", color: "#6b7280" },
  { id: "event", label: "Event", emoji: "🎉", color: "#ec4899" },
  { id: "gaming", label: "Gaming", emoji: "🎮", color: "#06b6d4" },
  { id: "fitness", label: "Fitness", emoji: "💪", color: "#10b981" },
  { id: "sports", label: "Sports", emoji: "⚽", color: "#3b82f6" },
  { id: "social", label: "Social", emoji: "👥", color: "#8b5cf6" },
  { id: "food", label: "Food", emoji: "🍕", color: "#eab308" },
  { id: "art", label: "Art", emoji: "🎨", color: "#ec4899" },
  { id: "outdoor", label: "Outdoor", emoji: "🏞️", color: "#14b8a6" },
];

export default function CreatePlanScreen({ navigation }) {
  const { user } = useAuth();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("movie");
  const [startDateTime, setStartDateTime] = useState(new Date());
  const [endDateTime, setEndDateTime] = useState(new Date(new Date().getTime() + 3600000)); // 1 hour later
  const [address, setAddress] = useState("");
  const [maxPeople, setMaxPeople] = useState(9);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateMode, setDateMode] = useState("date");
  const [datePickerType, setDatePickerType] = useState("startDate"); // startDate, startTime, endTime
  const [loading, setLoading] = useState(false);
  
  // Organiser specific state
  const [isOfficial, setIsOfficial] = useState(false);
  const [ticketUrl, setTicketUrl] = useState("");
  const [bannerImage, setBannerImage] = useState("");
  const isOrganiser = user?.role === 'organiser';

  // Load draft on component mount
  useEffect(() => {
    loadDraft();
  }, []);

  const saveDraft = async () => {
    try {
      if (!title && !description && !address) {
        Alert.alert("Empty Draft", "Please fill in at least some details before saving.");
        return;
      }

      const draftData = {
        title,
        description,
        category,
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        address,
        maxPeople,
        savedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem("planDraft", JSON.stringify(draftData));
      Alert.alert("Success", "Plan saved as draft!");
    } catch (error) {
      Alert.alert("Error", "Failed to save draft.");
      console.error(error);
    }
  };

  const loadDraft = async () => {
    try {
      const draft = await AsyncStorage.getItem("planDraft");
      if (draft) {
        const draftData = JSON.parse(draft);
        setTitle(draftData.title || "");
        setDescription(draftData.description || "");
        setCategory(draftData.category || "movie");
        setStartDateTime(new Date(draftData.startDateTime));
        setEndDateTime(new Date(draftData.endDateTime));
        setAddress(draftData.address || "");
        setMaxPeople(draftData.maxPeople || 9);
      }
    } catch (error) {
      console.error("Error loading draft:", error);
    }
  };

  const handleCreatePlan = async () => {
    if (!title || !category || !address) {
      Alert.alert("Missing Fields", "Please fill in all required fields (Title, Category, Location).");
      return;
    }

    if (endDateTime <= startDateTime) {
      Alert.alert("Invalid Time", "End time must be after start time.");
      return;
    }

    setLoading(true);
    try {
      // Generate deterministic mock coordinates based on address for the map to work
      const hash = address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const mockLat = 34.0522 + (hash % 100) / 1000; // Mock near LA
      const mockLng = -118.2437 + ((hash * 2) % 100) / 1000;

      const planData = {
        title,
        description,
        category,
        startDateTime,
        endDateTime,
        location: {
          address,
          coordinates: [mockLat, mockLng],
        },
        maxPeople: parseInt(maxPeople),
        isOfficial: isOrganiser ? isOfficial : false,
        ticketUrl: isOrganiser ? ticketUrl : "",
        bannerImage: isOrganiser ? bannerImage : "",
      };


      await createPlan(planData);
      navigation.navigate("Main");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", error.response?.data?.message || "Failed to create plan.");
    } finally {
      setLoading(false);
    }
  };

  const showPicker = (type, mode) => {
    setDatePickerType(type);
    setDateMode(mode);
    setShowDatePicker(true);
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      if (datePickerType === "startDate") {
        const newStartDateTime = new Date(selectedDate);
        newStartDateTime.setHours(startDateTime.getHours(), startDateTime.getMinutes());
        setStartDateTime(newStartDateTime);
      } else if (datePickerType === "startTime") {
        const newStartDateTime = new Date(startDateTime);
        newStartDateTime.setHours(selectedDate.getHours(), selectedDate.getMinutes());
        setStartDateTime(newStartDateTime);
      } else if (datePickerType === "endTime") {
        const newEndDateTime = new Date(endDateTime);
        newEndDateTime.setHours(selectedDate.getHours(), selectedDate.getMinutes());
        setEndDateTime(newEndDateTime);
      }
    }
  };

  // Custom static slider press handler
  const handleTrackPress = (event) => {
    const { locationX } = event.nativeEvent;
    // We assume the track width is approx width - 48 (padding 24 * 2)
    const trackWidth = width - 96; // Adjust for actual inner padding
    let percentage = locationX / trackWidth;
    percentage = Math.max(0, Math.min(1, percentage));
    const val = Math.round(2 + percentage * 8);
    setMaxPeople(val);
  };

  return (
    <AnimatedBackground>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 z-10">
        
        {/* Header */}
        <View className="px-6 pt-14 pb-6">
          <View className="flex-row justify-between items-center mb-6">
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              className="w-10 h-10 rounded-full bg-[#1c1c24] flex items-center justify-center border border-white/5"
            >
              <Ionicons name="arrow-back" size={20} color="#d1d5db" />
            </TouchableOpacity>
            <Text className="text-xl font-bold tracking-tight text-white">Create New Plan</Text>
            <View className="w-10 h-10" />
          </View>


        </View>

        <ScrollView className="flex-1 px-6 pb-24" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150 }}>
          
          {/* Category Section */}
          <View className="bg-white/5 border border-white/10 rounded-[32px] p-6 mb-4 shadow-2xl backdrop-blur-xl">
            <View className="flex-row items-center mb-6">
              <View className="w-10 h-10 rounded-[14px] bg-purple-500/20 items-center justify-center mr-3">
                <Ionicons name="layers" size={20} color="#a855f7" />
              </View>
              <View>
                <Text className="text-[17px] font-bold text-white">Choose Category</Text>
                <Text className="text-[11px] text-gray-400">What are you planning?</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 4 }}>
              {CATEGORIES.map((cat, index) => {
                const isActive = category === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setCategory(cat.id)}
                    activeOpacity={0.7}
                    style={[
                      {
                        width: '31%',
                        aspectRatio: 1,
                        borderRadius: 20,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 12,
                        backgroundColor: isActive ? 'rgba(168, 85, 247, 0.15)' : '#1c1c24',
                        borderWidth: 1,
                        borderColor: isActive ? 'rgba(168, 85, 247, 0.5)' : 'rgba(255, 255, 255, 0.05)',
                      },
                      isActive && {
                        elevation: 10,
                        shadowColor: '#a855f7',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 10,
                      }
                    ]}
                  >
                    <Text style={{ fontSize: 28, marginBottom: 6 }}>{cat.emoji}</Text>
                    <Text 
                      style={{ 
                        fontSize: 11, 
                        fontWeight: '700', 
                        color: isActive ? '#ffffff' : '#9ca3af' 
                      }}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Title Section */}
          <Animated.View entering={FadeInDown.delay(150)} className="bg-white/5 border border-white/10 rounded-[28px] p-6 mb-4 shadow-2xl backdrop-blur-xl">
            <View className="flex-row items-center gap-3 mb-5">
              <View className="w-10 h-10 rounded-[14px] bg-[#3b82f6]/20 flex items-center justify-center">
                <Ionicons name="pencil" size={20} color="#60a5fa" />
              </View>
              <View>
                <Text className="text-[17px] font-bold text-white">Plan Title</Text>
                <Text className="text-[11px] text-gray-400">Make it catchy!</Text>
              </View>
            </View>

            <TextInput
              className="w-full px-5 py-[14px] bg-white/5 border border-white/10 rounded-2xl text-white font-medium text-[13px]"
              placeholder="e.g., Avengers Night 🎥"
              placeholderTextColor="#6b7280"
              value={title}
              onChangeText={setTitle}
            />
          </Animated.View>

          {/* Location Section */}
          <Animated.View entering={FadeInDown.delay(200)} className="bg-white/5 border border-white/10 rounded-[28px] p-6 mb-4 shadow-2xl backdrop-blur-xl">
            <View className="flex-row items-center gap-3 mb-5">
              <View className="w-10 h-10 rounded-[14px] bg-[#0ea5e9]/20 flex items-center justify-center">
                <Ionicons name="location" size={20} color="#38bdf8" />
              </View>
              <View>
                <Text className="text-[17px] font-bold text-white">Location</Text>
                <Text className="text-[11px] text-gray-400">Where's it happening?</Text>
              </View>
            </View>

            <View className="relative mb-5">
              <View className="absolute left-4 top-[15px] z-10">
                <Ionicons name="search" size={16} color="#9ca3af" />
              </View>
              <TextInput
                className="w-full px-5 py-[14px] pl-[44px] bg-white/5 border border-white/10 rounded-2xl text-white font-medium text-[13px]"
                placeholder="Search location..."
                placeholderTextColor="#6b7280"
                value={address}
                onChangeText={setAddress}
              />
            </View>

            {/* Map Preview Fake Card */}
            <View className="h-36 bg-white/5 border border-white/10 rounded-[20px] overflow-hidden relative items-center justify-center mt-2">
               <View className="absolute inset-0 opacity-[0.15] bg-[#1e1e2d] border border-white/5" />
               <View className="absolute inset-0 bg-[#111118]/70 z-10 items-center justify-center">
                  <View 
                      className="w-11 h-11 rounded-full bg-blue-600/30 items-center justify-center mb-2 shadow-md"
                      style={{
                        elevation: 10,
                        shadowColor: '#3b82f6',
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.6,
                        shadowRadius: 10,
                      }}
                   >
                    <Ionicons name="map" size={20} color="#60a5fa" />
                  </View>
                  <Text className="text-[13px] font-bold text-gray-200 mt-1">{address || "Enter an address above"}</Text>
                  <Text className="text-[10px] text-gray-400 mt-[2px]">Location details</Text>
               </View>
            </View>
          </Animated.View>

          {/* Date & Time Section */}
          <Animated.View entering={FadeInDown.delay(250)} className="bg-white/5 border border-white/10 rounded-[28px] p-6 mb-4 shadow-2xl backdrop-blur-xl">
            <View className="flex-row items-center gap-3 mb-5">
              <View className="w-10 h-10 rounded-[14px] bg-[#e11d48]/20 flex items-center justify-center">
                <Ionicons name="time" size={20} color="#f43f5e" />
              </View>
              <View>
                <Text className="text-[17px] font-bold text-white">Event Time</Text>
                <Text className="text-[11px] text-gray-400">When should we meet?</Text>
              </View>
            </View>

            {/* Start Date */}
            <View className="mb-4">
              <Text className="text-[11px] text-gray-400 mb-[6px] font-medium">Start Date</Text>
              <TouchableOpacity 
                onPress={() => showPicker("startDate", "date")}
                className="bg-white/5 border border-white/10 rounded-2xl px-4 py-[14px] flex-row items-center gap-2"
              >
                <Ionicons name="calendar-outline" size={16} color="#9ca3af" />
                <Text className="text-[13px] font-medium text-white">
                  {startDateTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Start Time */}
            <View className="mb-4">
              <Text className="text-[11px] text-gray-400 mb-[6px] font-medium">Start Time</Text>
              <TouchableOpacity 
                onPress={() => showPicker("startTime", "time")}
                className="bg-white/5 border border-white/10 rounded-2xl px-4 py-[14px] flex-row items-center gap-2"
              >
                <Ionicons name="time-outline" size={16} color="#9ca3af" />
                <Text className="text-[13px] font-medium text-white">
                  {startDateTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true })}
                </Text>
              </TouchableOpacity>
            </View>

            {/* End Time */}
            <View>
              <Text className="text-[11px] text-gray-400 mb-[6px] font-medium">End Time</Text>
              <TouchableOpacity 
                onPress={() => showPicker("endTime", "time")}
                className="bg-white/5 border border-white/10 rounded-2xl px-4 py-[14px] flex-row items-center gap-2"
              >
                <Ionicons name="stop-circle-outline" size={16} color="#9ca3af" />
                <Text className="text-[13px] font-medium text-white">
                  {endDateTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true })}
                </Text>
              </TouchableOpacity>
              <Text className="text-[10px] text-gray-500 mt-2">
                Duration: {Math.round((endDateTime - startDateTime) / (1000 * 60))} mins
              </Text>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={
                  datePickerType === "startDate" 
                    ? startDateTime 
                    : datePickerType === "startTime"
                    ? startDateTime
                    : endDateTime
                }
                mode={dateMode}
                display="default"
                onChange={onDateChange}
                themeVariant="dark"
              />
            )}
          </Animated.View>

          {/* People Section */}
          <Animated.View entering={FadeInDown.delay(300)} className="bg-white/5 border border-white/10 rounded-[28px] p-6 mb-4 shadow-2xl backdrop-blur-xl">
            <View className="flex-row items-center justify-between mb-5">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-[14px] bg-[#9333ea]/20 flex items-center justify-center">
                  <FontAwesome5 name="user-friends" size={16} color="#c084fc" />
                </View>
                <View>
                  <Text className="text-[17px] font-bold text-white">Max People</Text>
                  <Text className="text-[11px] text-gray-400">How many buddies?</Text>
                </View>
              </View>
              
              <View className="items-end">
                <Text className="text-2xl font-black text-white">{maxPeople}</Text>
                <Text className="text-[10px] text-gray-400 mt-[-2px]">people</Text>
              </View>
            </View>

            {/* Custom Range Slider exact match to image */}
            <TouchableOpacity 
               activeOpacity={1} 
               onPress={handleTrackPress} 
               className="h-10 justify-center my-1"
            >
              <View className="h-[3px] bg-gray-700 rounded-full w-full relative">
                {/* Active Track */}
                <View 
                   className="h-full bg-purple-600 rounded-full absolute left-0" 
                   style={{ width: `${((maxPeople - 2) / 8) * 100}%` }} 
                />
                {/* Thumb */}
                <View 
                   className="w-[18px] h-[18px] bg-[#ec4899] rounded-full absolute top-1/2 -mt-[9px] shadow-lg" 
                   style={{ 
                     left: `${((maxPeople - 2) / 8) * 100}%`, 
                     marginLeft: -9,
                     elevation: 8,
                     shadowColor: '#ec4899',
                     shadowOffset: { width: 0, height: 0 },
                     shadowOpacity: 0.9,
                     shadowRadius: 6,
                   }} 
                />
              </View>
            </TouchableOpacity>
            
            <View className="flex-row justify-between -mt-1 px-1">
               <Text className="text-gray-500 text-[11px] font-medium">2</Text>
               <Text className="text-gray-500 text-[11px] font-medium">10</Text>
            </View>
          </Animated.View>

          {/* Description Section */}
          <Animated.View entering={FadeInDown.delay(350)} className="bg-white/5 border border-white/10 rounded-[28px] p-6 mb-8 shadow-2xl backdrop-blur-xl">
            <View className="flex-row items-center gap-3 mb-5">
              <View className="w-10 h-10 rounded-[14px] bg-[#4f46e5]/20 flex items-center justify-center">
                <Ionicons name="reorder-four" size={22} color="#818cf8" />
              </View>
              <View>
                <Text className="text-[17px] font-bold text-white">Description</Text>
                <Text className="text-[11px] text-gray-400">Optional details</Text>
              </View>
            </View>

            <TextInput
              className="w-full px-5 py-[14px] bg-white/5 border border-white/10 rounded-2xl text-[13px] text-white font-medium text-left leading-5 mt-2"
              placeholder="Tell people what to expect..."
              placeholderTextColor="#6b7280"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
              style={{ minHeight: 90 }}
            />
          </Animated.View>

          {/* Organiser Section */}
          {isOrganiser && (
            <Animated.View entering={FadeInDown.delay(380)} className="bg-white/5 border border-white/10 rounded-[28px] p-6 mb-8 shadow-2xl backdrop-blur-xl">
              <View className="flex-row items-center gap-3 mb-5">
                <View className="w-10 h-10 rounded-[14px] bg-amber-500/20 flex items-center justify-center">
                  <Ionicons name="shield-checkmark" size={22} color="#D4AF37" />
                </View>
                <View>
                  <Text className="text-[17px] font-bold text-white">Organiser Options</Text>
                  <Text className="text-[11px] text-gray-400">Professional event details</Text>
                </View>
              </View>

              <View className="flex-row items-center justify-between mb-6 px-1">
                <View>
                  <Text className="text-white font-semibold">Mark as Official Event</Text>
                  <Text className="text-[10px] text-gray-500">Adds verified badge & premium visibility</Text>
                </View>
                 <TouchableOpacity 
                    onPress={() => setIsOfficial(!isOfficial)}
                    className={`w-12 h-6 rounded-full items-center flex-row px-1 ${isOfficial ? 'bg-purple-600' : 'bg-gray-700'}`}
                    style={{ justifyContent: isOfficial ? 'flex-end' : 'flex-start' }}
                 >
                    <View className="w-4 h-4 rounded-full bg-white" />
                 </TouchableOpacity>
              </View>

              <Text className="text-[11px] text-gray-400 mb-2 ml-1">Banner Image URL</Text>
              <TextInput
                className="w-full px-5 py-[12px] bg-white/5 border border-white/10 rounded-xl text-[12px] text-white mb-4 mt-2"
                placeholder="https://..."
                placeholderTextColor="#4b5563"
                value={bannerImage}
                onChangeText={setBannerImage}
              />

              <Text className="text-[11px] text-gray-400 mb-2 ml-1">Ticket / Booking URL</Text>
              <TextInput
                className="w-full px-5 py-[12px] bg-white/5 border border-white/10 rounded-xl text-[12px] text-white mt-2"
                placeholder="https://eventbrite.com/..."
                placeholderTextColor="#4b5563"
                value={ticketUrl}
                onChangeText={setTicketUrl}
              />
            </Animated.View>
          )}

          {/* Action Buttons */}
          <Animated.View entering={FadeInDown.delay(400)} className="mb-4">
            <TouchableOpacity 
              onPress={handleCreatePlan}
              disabled={loading}
              activeOpacity={0.9} 
              className="w-full rounded-[20px] overflow-hidden shadow-xl mb-3"
              style={{
                elevation: 10,
              }}
            >
              <LinearGradient
                colors={['#9333ea', '#c084fc']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="py-[18px] flex-row items-center justify-center"
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Text className="text-white text-[17px] font-extrabold mr-2 tracking-wide">Create Plan</Text>
                    <Text className="text-lg">🚀</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={saveDraft}
              activeOpacity={0.8}
              className="w-full py-[16px] rounded-[20px] bg-white/5 border border-white/10 items-center justify-center"
            >
              <Text className="text-gray-300 font-bold text-[15px]">Save as Draft</Text>
            </TouchableOpacity>
          </Animated.View>

        </ScrollView>
      </KeyboardAvoidingView>
    </AnimatedBackground>
  );
}
