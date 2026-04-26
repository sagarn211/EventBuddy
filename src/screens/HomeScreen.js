import React, { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Image,
  Dimensions,
  FlatList,
  Alert,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";

import LinearGradient from "react-native-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Animated, { FadeInDown, FadeInUp, FadeInRight } from "react-native-reanimated";
import { useAuth } from "../context/AuthContext";
import { getPlans, getCategoryCounts } from "../api/planService";
import { getGlobalStories, deleteStoryFromBackend } from "../api/storyService";
import AnimatedBackground from "../components/AnimatedBackground";
import appConfig from "../config/appConfig";







const { width } = Dimensions.get("window");

const APP_QUICK_ACTIONS = [
  {
    id: "find",
    title: "Find Buddy",
    subtitle: "Match with some-one",
    icon: "compass",
    colors: ["#6366F1", "#4F46E5"], // Indigo
    shadow: "rgba(99, 102, 241, 0.3)",
    target: "Buddies"
  },
  {
    id: "create",
    title: "Create Plan",
    subtitle: "Start something new",
    icon: "feather",
    colors: ["#94a3b8", "#475569"], // Silver/Slate
    shadow: "rgba(148, 163, 184, 0.2)",
    target: "CreatePlan"
  },
  {
    id: "browse",
    title: "Browse Events",
    subtitle: "See what's happening",
    icon: "map",
    colors: ["#334155", "#0f172a"], // Midnight
    shadow: "rgba(15, 23, 42, 0.4)",
    target: "Map"
  },
];

const TRENDING_INITIAL = [
  { id: "music", label: "Live Music", count: "0 events", icon: "music", bg: "rgba(255, 255, 255, 0.05)", color: "#E5E7EB" },
  { id: "sports", label: "Sports", count: "0 events", icon: "running", bg: "rgba(255, 255, 255, 0.05)", color: "#E5E7EB" },
  { id: "food", label: "Dining", count: "0 events", icon: "utensils", bg: "rgba(255, 255, 255, 0.05)", color: "#E5E7EB" },
  { id: "art", label: "Culture", count: "0 events", icon: "palette", bg: "rgba(255, 255, 255, 0.05)", color: "#E5E7EB" },
];

const MOCK_PLANS = [
  {
    _id: "mock1",
    title: "Coffee & Chill ☕",
    category: "cafe",
    dateTime: new Date().toISOString(),
    location: { address: "Starbucks, MG Road" },
    maxPeople: 4,
    participants: ["mock_u1"],
    creator: { name: "Sarah Kim", avatar: "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-5.jpg" },
    description: "Looking for someone to grab coffee with and chat about tech!",
  },
  {
    _id: "mock2",
    title: "Dune: Part Two Watch Party",
    category: "movie",
    dateTime: new Date().toISOString(),
    location: { address: "AMC Loews Lincoln Square, 1998 Broadway" },
    maxPeople: 8,
    participants: ["mock_u1", "mock_u2", "mock_u3"],
    creator: { name: "Alex Chen", avatar: "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg" },
    description: "Looking for movie lovers to join! We have premium seats in row G. Popcorn and drinks on me! 🍿",
  }
];

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [featuredPlans, setFeaturedPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [trending, setTrending] = useState(TRENDING_INITIAL);
  const [stories, setStories] = useState([]);


  const fetchPlans = async (category = "all") => {
    try {
      setLoading(true);
      const [plansRes, countsRes, storiesRes] = await Promise.all([
        getPlans(category),
        getCategoryCounts(),
        getGlobalStories()
      ]);
      
      setPlans(plansRes.data.data || []);
      setStories(storiesRes.data.data || []);
      
      const featured = (plansRes.data.data || []).filter(p => p.isOfficial);
      setFeaturedPlans(featured);

      
      if (countsRes.data.success) {
        const counts = countsRes.data.data;
        setTrending(prev => prev.map(item => {
          const countObj = counts.find(c => c._id === item.id);
          return { ...item, count: `${countObj ? countObj.count : 0} events` };
        }));
      }
    } catch (error) {
      const is401 = error.response && error.response.status === 401;
      if (!is401) {
        console.error("Error fetching plans or stories:", error);
      } else {
        console.warn("Unauthorized fetching stories - user will be logged out");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPlans(selectedCategory);
    }, [selectedCategory])
  );

  const handleStoryLongPress = (storyId) => {
    Alert.alert(
      "Delete Story", 
      "Are you sure you want to delete this story?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              await deleteStoryFromBackend(storyId);
              fetchPlans(selectedCategory); // Refresh
            } catch (err) {

              console.error("Error deleting story:", err);
            }
          }
        }
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPlans(selectedCategory);
  };

  const renderHeader = () => (
    <View className="px-6 pt-6 pb-4">
      <View className="flex-row items-center justify-between mb-6">
        <View className="flex-row items-center gap-3">
          <View>
            <Image
              source={{ uri: user?.avatar || appConfig.defaultAvatar }}
              className="w-12 h-12 rounded-full border border-white/10"
            />
            <View className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#020205]" />
          </View>

          <View>
            <Text className="text-2xl font-bold text-white tracking-tight">Hey {user?.name?.split(' ')[0] || "Friend"} 👋</Text>
            <Text className="text-xs text-gray-500 font-medium tracking-wide uppercase mt-0.5">Explore the extraordinary</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate("Notifications")} className="w-11 h-11 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/10 relative">
          <Ionicons name="notifications-outline" size={20} color="#9ca3af" />
          <View className="absolute top-3.5 right-3.5 w-2 h-2 bg-indigo-500 rounded-full" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFeaturedEvents = () => {
    if (featuredPlans.length === 0) return null;

    return (
      <View className="mb-8">
        <View className="px-6 flex-row items-center justify-between mb-4">
          <Text className="text-lg font-bold text-white tracking-tight">Featured Events</Text>
          <TouchableOpacity>
            <Text className="text-indigo-400 text-xs font-bold uppercase tracking-widest">See All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={{ paddingHorizontal: 24, gap: 20 }}
          snapToInterval={280 + 20}
          decelerationRate="fast"
        >
          {featuredPlans.map((item) => (
            <TouchableOpacity 
              key={item._id}
              activeOpacity={0.9}
              onPress={() => navigation.navigate("PlanDetail", { plan: item })}
              className="overflow-hidden rounded-[32px] bg-[#181820] border border-white/10"
              style={{ width: 280, height: 180 }}
            >
              <Image 
                source={{ uri: item.bannerImage || "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=500" }} 
                className="absolute inset-0 w-full h-full"
                resizeMode="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                className="absolute inset-x-0 bottom-0 p-4 pt-10"
              >
                <View className="flex-row items-center gap-1.5 mb-1">
                  <View className="px-2 py-0.5 bg-amber-500/20 rounded-md flex-row items-center gap-1 border border-amber-500/30">
                    <Ionicons name="shield-checkmark" size={10} color="#D4AF37" />
                    <Text className="text-[9px] font-bold text-[#D4AF37] uppercase tracking-wider">Official</Text>
                  </View>
                </View>
                <Text className="text-white font-bold text-lg leading-tight" numberOfLines={1}>{item.title}</Text>
                <Text className="text-gray-300 text-xs mt-1" numberOfLines={1}>
                  <Ionicons name="location-outline" size={12} color="#9ca3af" /> {item.location?.address}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderStories = () => (
    <View className="mb-6">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}>
        <TouchableOpacity 
          onPress={() => navigation.navigate("AddStory")}
          className="items-center"
        >
          <View className="w-16 h-16 rounded-full border border-white/10 items-center justify-center bg-white/[0.03]">
             <Ionicons name="add" size={24} color="#9ca3af" />
          </View>
          <Text className="text-[10px] text-gray-400 mt-2 font-medium">Add Story</Text>
        </TouchableOpacity>

        {stories.map((story, index) => (
          <TouchableOpacity 
            key={story._id} 
            className="items-center"
            onLongPress={() => handleStoryLongPress(story._id)}
          >
            <View className="w-16 h-16 rounded-full border border-white/10 p-1">

               <Image 
                  source={{ uri: story.media || story.userId?.avatar || appConfig.defaultAvatar }} 
                  className="w-full h-full rounded-full"
               />


            </View>
            <Text className="text-[10px] text-gray-300 mt-2 font-medium" numberOfLines={1}>
              {story.userName || story.userId?.name || 'Someone'}
            </Text>

          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );


  const renderQuickActions = () => (
    <View className="px-6 mb-8">
      <Text className="text-xs font-bold text-gray-500 uppercase tracking-[3px] mb-4">Prime Access</Text>
      <View className="gap-4">
        {APP_QUICK_ACTIONS.map((action, index) => (
          <Animated.View key={action.id} entering={FadeInDown.delay(index * 100).duration(600)}>
            <TouchableOpacity
              onPress={() => {
                console.log('Action Pressed:', action.id, 'Target:', action.target);
                if (action.target === "Map") {
                  navigation.getParent()?.navigate("Map");
                } else if (action.target) {
                  navigation.navigate(action.target);
                }
              }}
              activeOpacity={0.9}
              className="bg-white/[0.02] border border-white/5 rounded-3xl p-5 flex-row items-center justify-between"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.03)" }}
            >
              <View className="flex-row items-center gap-4">
                <LinearGradient
                  colors={action.colors}
                  className="w-14 h-14 rounded-2xl items-center justify-center"
                  style={{ shadowColor: action.shadow, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 5 }}
                >
                  <FontAwesome5 name={action.icon} size={24} color="white" />
                </LinearGradient>
                <View>
                  <Text className="text-lg font-semibold text-white">{action.title}</Text>
                  <Text className="text-sm text-gray-400">{action.subtitle}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6b7280" />
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </View>
  );

  const renderNearbyPlans = () => (
    <View className="mb-8">
      <View className="px-6 flex-row items-center justify-between mb-4">
        <Text className="text-lg font-bold text-white tracking-tight">Curated For You</Text>
        <TouchableOpacity onPress={() => navigation.getParent()?.navigate("Map")}>
          <Text className="text-sm text-purple-400 font-medium">See All</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="small" color="#a855f7" className="mt-4" />
      ) : (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={plans}
          keyExtractor={(item, index) => item._id || index.toString()}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}
          ListEmptyComponent={
            <View className="items-center justify-center p-6 bg-white/5 border border-white/10 rounded-2xl" style={{ width: width * 0.85 }}>
              <Ionicons name="calendar-outline" size={32} color="#9ca3af" className="mb-2" />
              <Text className="text-gray-300 text-center font-medium">No plans found nearby.</Text>
              <Text className="text-gray-500 text-center text-xs mt-1">Be the first to create one!</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInRight.delay(index * 200).duration(800)}>
              <TouchableOpacity
                onPress={() => item._id && navigation.navigate("PlanDetail", { plan: item })}
                activeOpacity={0.9}
                className="bg-white/[0.03] border border-white/5 rounded-[28px] p-5"
                style={{ width: width * 0.78 }}
              >
                <View className="flex-row items-start justify-between mb-4">
                  <View className="flex-row items-center gap-2">
                    <View className="w-2 h-2 bg-green-500 rounded-full" />
                    <Text className="text-xs text-gray-400">Live now</Text>
                  </View>
                  <View className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
                    <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">New</Text>
                  </View>
                </View>

                <View className="flex-row items-center gap-3 mb-4">
                  <Image 
                    source={{ uri: item.createdBy?.avatar || appConfig.defaultAvatar }} 
                    className="w-10 h-10 rounded-full border border-white/10"
                  />

                  <View>
                    <Text className="text-lg font-bold text-white mb-0" numberOfLines={1}>
                      {item.title || "Untitled Plan"}
                    </Text>
                    <Text className="text-xs text-gray-400" numberOfLines={1}>
                      by {item.createdBy?.name || "Buddy"} • {item.locationName || item.location?.address || "Location TBD"}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center gap-2">
                  <Ionicons name="time-outline" size={16} color="#60a5fa" />
                  <Text className="text-sm text-gray-300">
                    {item.dateTime ? new Date(item.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Time TBD"}
                  </Text>
                </View>

                <View className="flex-row items-center justify-between mt-4 pt-4 border-t border-white/10">
                  <View className="flex-row items-center">
                    <Ionicons name="people" size={16} color="#9ca3af" />
                    <Text className="text-xs text-gray-300 ml-1 font-bold">
                       {item.participants?.length || 1} / {item.maxPeople || 10}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => item._id && navigation.navigate("PlanDetail", { plan: item })} className="rounded-xl overflow-hidden">
                    <LinearGradient
                      colors={['#1f2937', '#111827']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      className="px-5 py-2.5"
                    >
                      <Text className="text-white font-bold text-sm">Join</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}
        />
      )}
    </View>
  );

  const renderTrending = () => (
    <View className="px-6 mb-10">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-lg font-bold text-white tracking-tight">Trending Now</Text>
        <TouchableOpacity onPress={() => setSelectedCategory("all")}>
          <Text className="text-sm text-pink-400 font-medium">Reset</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row flex-wrap -mx-2">
        {trending.map((item, index) => (
          <View key={item.id} className="w-1/2 px-2 pb-4">
            <Animated.View entering={FadeInDown.delay(index * 100).duration(600)}>
              <TouchableOpacity
                onPress={() => setSelectedCategory(item.id)}
                activeOpacity={0.8}
                className={`border rounded-2xl p-4 ${selectedCategory === item.id ? 'bg-white/10 border-white/20' : 'bg-white/[0.03] border-white/5'}`}
              >
                <View
                  className="w-12 h-12 rounded-xl items-center justify-center mb-3"
                  style={{ backgroundColor: item.bg }}
                >
                  <FontAwesome5 name={item.icon} size={20} color={item.color} />
                </View>
                <Text className="font-bold text-white mb-1">{item.label}</Text>
                <Text className="text-xs text-gray-500">{item.count}</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <AnimatedBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#a855f7" />
          }
        >
          {renderHeader()}
          {renderFeaturedEvents()}
          {renderStories()}
          {renderQuickActions()}
          {renderNearbyPlans()}
          {renderTrending()}
        </ScrollView>
      </SafeAreaView>
    </AnimatedBackground>
  );
}
