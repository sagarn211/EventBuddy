import React, { useState, useCallback, useEffect } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  SafeAreaView,
  Platform,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  FadeInRight,
  Layout,
  SlideInRight
} from "react-native-reanimated";
import { getPlans, joinPlan } from "../api/planService";
import appConfig from "../config/appConfig";
import AnimatedBackground from "../components/AnimatedBackground";
import { useAuth } from "../context/AuthContext";

const { width } = Dimensions.get("window");

const CATEGORY_STYLES = {
  movie: { label: "Movie", emoji: "🎬", colors: ["#d946ef", "#a855f7"] },
  cafe: { label: "Café", emoji: "☕", colors: ["#fb923c", "#f97316"] },
  event: { label: "Event", emoji: "🎉", colors: ["#3b82f6", "#2563eb"] },
  gaming: { label: "Gaming", emoji: "🎮", colors: ["#4ade80", "#10b981"] },
  food: { label: "Food", emoji: "🍕", colors: ["#eab308", "#ca8a04"] },
  sports: { label: "Sports", emoji: "🏃", colors: ["#3b82f6", "#1d4ed8"] },
};

export default function MapScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [plans, setPlans] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMsg, setErrorMsg] = useState(null);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await getPlans();
      console.log("Elite Discovery API:", response.data?.success ? "OK" : "ERR", "Count:", (response.data?.data || response.data)?.length);
      
      const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      setPlans(data);
      setErrorMsg(null);
    } catch (error) {
      console.error("Discovery Fetch Error:", error);
      setErrorMsg(`API Error: ${error.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatTime = (date) => {
    try {
      if (!date || isNaN(new Date(date).getTime())) return "Time TBD";
      const d = new Date(date);
      let hours = d.getHours();
      const minutes = d.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; 
      const strMinutes = minutes < 10 ? '0' + minutes : minutes;
      return hours + ':' + strMinutes + ' ' + ampm;
    } catch (e) {
      return "Time TBD";
    }
  };

  const calculateDistance = (planLoc) => {
    if (!planLoc || !planLoc.coordinates || !user?.location?.coordinates) return "Nearby";
    
    const [lon1, lat1] = user.location.coordinates;
    const [lon2, lat2] = planLoc.coordinates;
    
    if (lon1 === 0 && lat1 === 0) return "Nearby";
    
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const dist = R * c;
    
    if (dist < 1) return `${(dist * 1000).toFixed(0)}m`;
    return `${dist.toFixed(1)}km`;
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPlans();
  };

  const handleJoin = async (planId) => {
    try {
      setLoading(true);
      await joinPlan(planId);
      Alert.alert("Success", "You've secured your spot!", [
        { text: "View Details", onPress: () => navigation.navigate("PlanDetail", { planId }) },
        { text: "OK" }
      ]);
      fetchPlans(); 
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Failed to join experience");
    } finally {
      setLoading(false);
    }
  };

  let displayPlans = [];
  try {
    const safePlans = (plans || []).filter(p => p && p._id);
    displayPlans = safePlans.filter(p => {
      const matchesCategory = selectedCategory === "all" || (typeof p.category === 'string' && p.category.toLowerCase() === selectedCategory);
      
      const title = typeof p.title === 'string' ? p.title.toLowerCase() : "";
      const desc = typeof p.description === 'string' ? p.description.toLowerCase() : "";
      const search = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || title.includes(search) || desc.includes(search);
      
      return matchesCategory && matchesSearch;
    });
  } catch (err) {
    console.error("Filter crash:", err);
  }

  const renderEliteCard = (item, index) => {
    try {
      if (!item || !item._id) return null;
      const itemCategory = typeof item.category === 'string' ? item.category.toLowerCase() : 'event';
      const cat = CATEGORY_STYLES[itemCategory] || CATEGORY_STYLES.event;
      const timeStr = formatTime(item.dateTime);
      const participantCount = Array.isArray(item.participants) ? item.participants.length : 0;

    return (
      <Animated.View 
        key={item._id}
        entering={FadeInDown.delay(index * 50).duration(400)}
        className="mb-6"
      >
        <TouchableOpacity
          onPress={() => navigation.navigate("PlanDetail", { plan: item })}
          activeOpacity={0.9}
          className="bg-white/[0.03] border border-white/5 rounded-[32px] overflow-hidden shadow-2xl"
        >
          {/* Main Content Area */}
          <View className="p-6">
            <View className="flex-row justify-between items-start mb-6">
              <View className="flex-row items-center gap-3">
                <LinearGradient
                  colors={cat.colors}
                  className="w-12 h-12 rounded-2xl items-center justify-center shadow-lg"
                >
                  <Text className="text-xl">{cat.emoji}</Text>
                </LinearGradient>
                <View>
                  <Text className="text-white font-bold text-lg tracking-tight">{item.title || "Untitled Plan"}</Text>
                  <Text className="text-gray-500 text-[10px] uppercase tracking-[2px] font-bold mt-0.5">{cat.label} • {timeStr}</Text>
                </View>
              </View>
              
              <View className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 items-center justify-center">
                 <Text className="text-gray-400 font-bold text-[10px]">{calculateDistance(item.location)}</Text>
              </View>
            </View>

            <Text className="text-gray-400 text-[13px] leading-5 mb-6" numberOfLines={2}>
              {item.description || "Join this amazing experience curated for the community."}
            </Text>

            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <View className="flex-row">
                  {(item.participants || []).slice(0, 3).map((participant, i) => {
                    const avatarUri = (typeof participant === 'object' && participant.avatar) 
                                        ? participant.avatar 
                                        : `https://ui-avatars.com/api/?name=${typeof participant === 'object' ? participant.name || "U" : "U"}&background=random`;
                    return (
                      <Image 
                        key={`part-${i}`} 
                        source={{ uri: avatarUri }}
                        className="w-8 h-8 rounded-full border-2 border-[#0a0a1a] bg-gray-800 -ml-2 first:ml-0"
                      />
                    );
                  })}
                  <View className="w-8 h-8 rounded-full border-2 border-[#0a0a1a] bg-indigo-600/20 items-center justify-center -ml-2">
                    <Text className="text-[8px] text-indigo-400 font-bold">+{participantCount}</Text>
                  </View>
                </View>
                <Text className="text-[11px] text-gray-500 font-medium ml-1">Joined elite group</Text>
              </View>

              <TouchableOpacity 
                onPress={() => handleJoin(item._id)}
                className="flex-row items-center bg-white/[0.04] border border-white/10 px-4 py-2 rounded-xl"
              >
                 <Text className="text-white font-bold text-[11px] uppercase tracking-wider mr-2">Secure Spot</Text>
                 <Ionicons name="arrow-forward" size={12} color="#6366f1" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Decorative Bottom Gradient */}
          <LinearGradient
            colors={['transparent', 'rgba(99, 102, 241, 0.03)']}
            className="h-1 absolute bottom-0 left-0 right-0"
          />
        </TouchableOpacity>
      </Animated.View>
    );
    } catch (e) {
      console.error("Card Render Error:", e);
      return (
        <View key={index} className="p-4 bg-red-900/20 border border-red-500/30 rounded-2xl mb-4">
          <Text className="text-red-400 font-bold text-xs uppercase">Card Crash: {e.message}</Text>
        </View>
      );
    }
  };

  return (
    <AnimatedBackground>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <SafeAreaView className="flex-1" style={{ backgroundColor: 'transparent' }}>
        <View className="px-6 pt-6 pb-2">
           {/* Header */}
          <View className="flex-row items-center justify-between mb-8">
            <View>
              <View className="flex-row items-center gap-2 mb-1">
                 <View className="w-2 h-2 rounded-full bg-emerald-500" />
                 <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-[3px]">Live Discovery</Text>
              </View>
              <Text className="text-3xl font-extrabold text-white tracking-tight">Elite Gallery</Text>
            </View>
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 items-center justify-center"
            >
              <Ionicons name="close-outline" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View className="relative mb-8">
            <View className="absolute left-4 top-4 z-10">
              <Ionicons name="search-outline" size={20} color="#4b5563" />
            </View>
            <TextInput
              placeholder="Search experiences..."
              placeholderTextColor="#4b5563"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="bg-white/[0.02] border border-white/5 rounded-2xl py-4 pl-12 pr-14 text-white font-medium"
            />
            <TouchableOpacity 
              onPress={() => setSelectedCategory("all")}
              className="absolute right-4 top-4"
            >
              <Ionicons name="options-outline" size={20} color="#6366f1" />
            </TouchableOpacity>
          </View>

          {/* Category Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4" contentContainerStyle={{ paddingBottom: 10 }}>
            {["all", "movie", "cafe", "event", "gaming", "food", "sports"].map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                className={[
                  "mr-3 px-6 py-2.5 rounded-xl border",
                  selectedCategory === cat 
                    ? "bg-indigo-600 border-indigo-500 shadow-xl" 
                    : "bg-white/[0.03] border-white/5"
                ].join(" ")}
              >
                <Text className={`text-[11px] font-bold uppercase tracking-widest ${selectedCategory === cat ? "text-white" : "text-gray-500"}`}>
                  {cat === "all" ? "Discover All" : cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {errorMsg && (
          <View className="mx-6 p-4 bg-red-600/20 border border-red-500 rounded-2xl mb-4">
            <Text className="text-red-400 font-bold mb-1">Elite Tracker: Critical Error ⚠️</Text>
            <Text className="text-white text-xs">{errorMsg}</Text>
            <TouchableOpacity onPress={() => { setErrorMsg(null); fetchPlans(); }} className="mt-2">
              <Text className="text-blue-400 font-bold text-xs">Tap to Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
          }
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {loading && !refreshing ? (
            <View className="py-20 items-center">
              <ActivityIndicator color="#6366f1" />
              <Text className="text-gray-500 mt-4 font-medium italic tracking-widest uppercase text-[10px]">Curating Vibe...</Text>
            </View>
          ) : displayPlans.length === 0 ? (
            <View className="py-20 items-center">
              <Ionicons name="compass-outline" size={48} color="#1f2937" />
              <Text className="text-gray-500 mt-4 font-bold tracking-widest text-[11px] uppercase">No experiences found nearby</Text>
            </View>
          ) : (
            displayPlans.map((item, index) => renderEliteCard(item, index))
          )}
        </ScrollView>
      </SafeAreaView>
    </AnimatedBackground>
  );
}
