import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  
  Image,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Platform,
  Share,
  Modal
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useFocusEffect } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import LinearGradient from "react-native-linear-gradient";


import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useAuth } from "../context/AuthContext";
import { getMe, getUserById } from "../api/userService";
import { getUserPlans, getPlanById } from "../api/planService";
import { getUserReviews, getUserRating } from "../api/reviewService";
import { getBuddies } from "../api/friendshipService";
import AnimatedBackground from "../components/AnimatedBackground";
import appConfig from "../config/appConfig";



export default function ProfileScreen({ navigation }) {
  const { logout, user: authUser } = useAuth();
  const [user, setUser] = useState(null);
  const [userStats, setUserStats] = useState({ rating: 0, reviewCount: 0 });
  const [userPlans, setUserPlans] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [buddiesCount, setBuddiesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [showPlansModal, setShowPlansModal] = useState(false);
  const [plansModalType, setPlansModalType] = useState("all");

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const profileResponse = await getMe();
      const userData = profileResponse.data.data;
      setUser(userData);

      // Fetch user rating and reviews
      try {
        const ratingResponse = await getUserRating(userData._id);
        setUserStats({
          rating: ratingResponse.data.averageRating || 0,
          reviewCount: ratingResponse.data.reviewCount || 0,
        });
      } catch (error) {
        console.log("Could not fetch user rating");
      }

      // Fetch user plans for recent activity
      try {
        const plansResponse = await getUserPlans();
        const plans = plansResponse.data.data || [];
        setUserPlans(plans);
        
        // Update activity
        const recent = plans.slice(0, 3);
        setRecentActivity(recent);
      } catch (error) {
        console.log("Could not fetch user plans");
      }

      // Fetch buddies count
      try {
        const buddiesRes = await getBuddies();
        setBuddiesCount(buddiesRes.data.data?.length || 0);
      } catch (error) {
        console.log("Could not fetch buddies");
      }

    } catch (error) {
      console.error("Error fetching profile:", error);
      Alert.alert("Error", "Could not load profile data.");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchProfile();
  }, []);

  // Refetch profile when screen comes into focus (after returning from edit)
  useFocusEffect(
    React.useCallback(() => {
      fetchProfile();
    }, [])
  );

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logout },
    ]);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out my EventBuddy profile! 🎉\nName: ${displayName}\nJoined: ${displayEmail}\n\nLet's connect and explore amazing events together!`,
        title: "Share Profile",
      });
    } catch (error) {
      console.error("Error sharing:", error);
      Alert.alert("Error", "Could not share profile");
    }
  };

  const handleStatClick = (statType) => {
    if (statType === "joined") {
      setPlansModalType("joined");
      setShowPlansModal(true);
    } else if (statType === "attended") {
      setPlansModalType("created");
      setShowPlansModal(true);
    } else if (statType === "rating") {
      // Navigate to credibility/reviews
      navigation.navigate("Credibility");
    }
  };

  const getFilteredPlans = () => {
    if (plansModalType === "joined") {
      return userPlans.filter(p => p.creatorId?._id !== user?._id);
    } else if (plansModalType === "created") {
      return userPlans.filter(p => p.creatorId?._id === user?._id);
    }
    return userPlans;
  };

  const getActivityIcon = (plan) => {
    const category = plan?.category?.toLowerCase() || "event";
    switch (category) {
      case "music":
        return { name: "music", color: "#c084fc" };
      case "art":
        return { name: "paint-brush", color: "#22d3ee" };
      case "sports":
        return { name: "running", color: "#fbbf24" };
      case "food":
        return { name: "utensils", color: "#f87171" };
      default:
        return { name: "calendar", color: "#a78bfa" };
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0a0a15", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#a855f7" />
      </View>
    );
  }

  // Fallbacks against mock UI aesthetic
  const displayName = user?.name || "User";
  const displayEmail = user?.phone ? `${user.phone}` : (user?.email || "No email");
  const avatarUrl = user?.avatar || appConfig.defaultAvatar;


  const bio = user?.bio || "No bio yet. Tap edit to add one!";
  const interests = user?.interests || [];
  
  // Calculate stats
  // Calculate stats dynamically from fetched plans
  const eventsJoined = userPlans.filter(p => {
    const creator = p.createdBy?._id || p.createdBy || p.creatorId?._id || p.creatorId;
    return creator !== user?._id;
  }).length;
  const eventsCreated = userPlans.filter(p => {
    const creator = p.createdBy?._id || p.createdBy || p.creatorId?._id || p.creatorId;
    return creator === user?._id;
  }).length;

  const userRating = userStats.rating || 0;

  
  // Format joined date
  const formatJoinedDate = () => {
    if (!user?.createdAt) return "Recently";
    const date = new Date(user.createdAt);
    const months = ["January", "February", "March", "April", "May", "June", 
                    "July", "August", "September", "October", "November", "December"];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Get location string
  const getLocationString = () => {
    if (user?.city) {
      return user.city;
    }
    return "Location not set";
  };

  return (
    <AnimatedBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView 
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {/* Header */}
          <View className="px-5 pt-3 mb-6 flex-row items-center justify-between z-10" style={{ paddingTop: Platform.OS === 'android' ? 40 : 12 }}>
             <TouchableOpacity 
                onPress={() => navigation.goBack()}
                className="w-10 h-10 rounded-full bg-[#1c1c24] border border-white/5 flex items-center justify-center shadow-lg"
             >
                <Ionicons name="chevron-back" size={22} color="white" />
             </TouchableOpacity>

             <Text className="text-[18px] font-bold text-white tracking-wide">Profile</Text>

             <TouchableOpacity 
                onPress={() => navigation.navigate("Settings")}
                className="w-10 h-10 rounded-full bg-[#1c1c24] border border-white/5 flex items-center justify-center shadow-lg"
             >
                <Ionicons name="settings-outline" size={20} color="white" />
             </TouchableOpacity>
          </View>

          {/* Profile Summary Section */}
          <Animated.View entering={FadeInDown.delay(100)} className="items-center px-6 mb-8 mt-2">
             <View className="relative mb-5">
                {/* Neon Ring Gradient Border */}
                <LinearGradient 
                   colors={['#1f2937', '#111827']}
                   start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                   style={{ width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', padding: 1.5 }}
                >
                   <View className="w-full h-full bg-[#050508] items-center justify-center overflow-hidden border border-white/5" style={{ borderRadius: 58 }}>
                      <Image source={{ uri: avatarUrl }} className="w-full h-full" />
                   </View>
                </LinearGradient>

                {/* Verified Checkmark Badge (Clean Silver Design) */}
                <View className="absolute bottom-1 right-2 w-7 h-7 rounded-full bg-[#050508] flex items-center justify-center border border-white/10 shadow-xl">
                   <Ionicons name="checkmark-circle" size={18} color="#E5E7EB" />
                </View>
             </View>

             <Text className="text-[28px] font-extrabold text-white mb-1 tracking-tight">{displayName}</Text>
             <Text className="text-[12px] text-gray-500 font-bold uppercase tracking-[2px] mb-4">{displayEmail}</Text>

             <Text className="text-[14px] text-gray-400 text-center leading-6 px-4 font-medium italic">
                "{bio}"
             </Text>
          </Animated.View>

          {/* Edit Profile & Share Buttons */}
          <Animated.View entering={FadeInDown.delay(200)} className="flex-row items-center justify-center gap-3 px-6 mb-10">
             <TouchableOpacity 
                onPress={() => navigation.navigate("ProfileSetup", { user })}
                className="flex-1 shadow-2xl border border-white/5" style={{ borderRadius: 16, overflow: 'hidden' }}>
                <LinearGradient 
                   colors={['#1f2937', '#111827']}
                   start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                   style={{ paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
                >
                   <Text className="text-white text-[13px] font-bold tracking-[2px] uppercase">Edit Profile</Text>
                </LinearGradient>
             </TouchableOpacity>

             <TouchableOpacity 
                onPress={handleShare}
                className="w-[50px] h-[50px] bg-white/[0.03] border border-white/5 flex items-center justify-center shadow-lg active:bg-white/10 transition-colors" style={{ borderRadius: 16 }}>
                <Ionicons name="share-social-outline" size={20} color="#9ca3af" />
             </TouchableOpacity>
          </Animated.View>

          {/* Statistics Grid */}
          <Animated.View entering={FadeInDown.delay(300)} className="flex-row gap-3 px-6 mb-10">
             {/* Stat 1 */}
             <TouchableOpacity 
                onPress={() => handleStatClick("joined")}
                className="flex-1 bg-white/[0.03] border border-white/5 rounded-[24px] p-5 items-center justify-center">
                <Text className="text-white text-[24px] font-bold mb-1">{eventsJoined}</Text>
                <Text className="text-gray-500 text-[10px] text-center font-bold leading-4 uppercase tracking-[2px]">Joined</Text>
             </TouchableOpacity>
             
             {/* Stat 2 */}
             <TouchableOpacity 
                onPress={() => handleStatClick("attended")}
                className="flex-1 bg-white/[0.03] border border-white/5 rounded-[24px] p-5 items-center justify-center">
                <Text className="text-white text-[24px] font-bold mb-1">{eventsCreated}</Text>
                <Text className="text-gray-500 text-[10px] text-center font-bold leading-4 uppercase tracking-[2px]">Created</Text>
             </TouchableOpacity>

             {/* Stat 3 */}
             <TouchableOpacity 
                onPress={() => handleStatClick("buddies")}
                className="flex-1 bg-white/[0.03] border border-white/5 rounded-[24px] p-5 items-center justify-center">
                <Text className="text-white text-[24px] font-bold mb-1">{buddiesCount}</Text>
                <Text className="text-gray-500 text-[10px] text-center font-bold leading-4 uppercase tracking-[2px]">Circle</Text>
             </TouchableOpacity>

          </Animated.View>

          {/* Achievements Slider */}
          <Animated.View entering={FadeInUp.delay(400)} className="mb-10">
             <View className="flex-row items-center justify-between px-6 mb-4">
                <Text className="text-[18px] font-bold text-white tracking-wide">Achievements</Text>
                <TouchableOpacity onPress={() => navigation.navigate("Credibility")}>
                   <Text className="text-[13px] font-bold text-[#22d3ee]">View All</Text>
                </TouchableOpacity>
             </View>
             <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}
              >
                {/* Badge 1 - Trusted Buddy */}
                <TouchableOpacity 
                  onPress={() => navigation.navigate("Credibility")}
                  className="w-[140px] bg-[#1c1c24]/80 border border-purple-500/30 rounded-[24px] p-5 items-center justify-center shadow-md"
                  style={{
                    elevation: 5,
                    shadowColor: '#a855f7',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 10,
                  }}>
                    <View className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 items-center justify-center mb-3">
                      <Text className="text-[20px]">⭐</Text>
                    </View>
                    <Text className="text-white text-[13px] font-bold text-center mb-1" numberOfLines={1}>Trusted Buddy</Text>
                    <Text className="text-gray-500 text-[9px] font-bold uppercase tracking-wider text-center">Elite Tier</Text>
                </TouchableOpacity>

                {/* Badge 2 - Verified */}
                {user?.isVerified && (
                  <TouchableOpacity 
                    onPress={() => navigation.navigate("Credibility")}
                    className="w-[140px] bg-[#1c1c24]/80 border border-cyan-500/30 rounded-[24px] p-5 items-center justify-center shadow-md"
                    style={{
                      elevation: 5,
                      shadowColor: '#06b6d4',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.15,
                      shadowRadius: 10,
                    }}>
                     <View className="w-12 h-12 rounded-2xl bg-cyan-500/20 items-center justify-center mb-3">
                        <Ionicons name="checkmark" size={24} color="#22d3ee" />
                     </View>
                     <Text className="text-white text-[13px] font-bold text-center mb-0.5" numberOfLines={1}>Verified ID</Text>
                     <Text className="text-gray-400 text-[10px] text-center">Identity confirmed</Text>
                  </TouchableOpacity>
                )}

                {/* Badge 3 - Active User */}
                <TouchableOpacity 
                  onPress={() => navigation.navigate("Credibility")}
                  className="w-[140px] bg-[#1c1c24]/80 border border-pink-500/30 rounded-[24px] p-5 items-center justify-center shadow-md"
                  style={{
                    elevation: 5,
                    shadowColor: '#ec4899',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 10,
                  }}>
                   <View className="w-12 h-12 rounded-2xl bg-pink-500/20 items-center justify-center mb-3">
                      <Text className="text-[20px]">🔥</Text>
                   </View>
                   <Text className="text-white text-[13px] font-bold text-center mb-0.5" numberOfLines={1}>Active User</Text>
                   <Text className="text-gray-400 text-[10px] text-center">30 day streak</Text>
                </TouchableOpacity>
              </ScrollView>
          </Animated.View>

          {/* Recent Activity */}
          <Animated.View entering={FadeInUp.delay(500)} className="px-6 mb-10">
             <Text className="text-[18px] font-bold text-white tracking-wide mb-4">Recent Activity</Text>
             <View className="gap-3">
                {recentActivity.length > 0 ? (
                  recentActivity.map((plan, index) => {
                    const activityIcon = getActivityIcon(plan);
                    const eventDate = plan?.date ? new Date(plan.date).toLocaleDateString() : "Upcoming";
                    return (
                      <TouchableOpacity 
                        key={plan._id || index}
                        onPress={() => navigation.navigate("PlanDetail", { planId: plan._id })}
                        className="bg-[#1c1c24]/80 border border-white/5 rounded-2xl p-4 flex-row items-center gap-4">
                        <View className="w-[45px] h-[45px] rounded-xl bg-purple-500/20 items-center justify-center">
                           <FontAwesome5 name={activityIcon.name} size={16} color={activityIcon.color} />
                        </View>
                        <View className="flex-1 justify-center">
                           <Text className="text-white text-[14px] font-bold mb-0.5" numberOfLines={1}>{plan.title}</Text>
                           <Text className="text-gray-400 text-[11px]" numberOfLines={1}>
                             {plan.creatorId?._id === user?._id ? "Hosted event" : "Joined as attendee"} • {eventDate}
                           </Text>
                        </View>
                        <Text className="text-gray-500 text-[10px] font-semibold">→</Text>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <View className="bg-[#1c1c24]/80 border border-white/5 rounded-2xl p-4 items-center justify-center">
                    <Text className="text-gray-400 text-[13px] font-semibold">No recent activity</Text>
                  </View>
                )}
             </View>
          </Animated.View>

          {/* Personal Details Section */}
          <Animated.View entering={FadeInUp.delay(600)} className="px-6 mb-10">
             <Text className="text-[18px] font-bold text-white tracking-wide mb-4">Personal Details</Text>
             <View className="bg-[#1c1c24]/80 border border-white/5 rounded-[24px] overflow-hidden">
                <View className="p-4 border-b border-white/5 flex-col">
                   <Text className="text-gray-400 text-[12px] font-semibold tracking-wide mb-1">Location</Text>
                   <Text className="text-white text-[14px] font-bold">{getLocationString()}</Text>
                </View>
                <View className="p-4 border-b border-white/5 flex-col">
                   <Text className="text-gray-400 text-[12px] font-semibold tracking-wide mb-1">Joined</Text>
                   <Text className="text-white text-[14px] font-bold">{formatJoinedDate()}</Text>
                </View>
                <View className="p-4 flex-col">
                   <Text className="text-gray-400 text-[12px] font-semibold tracking-wide mb-2">Interests</Text>
                   <View className="flex-row flex-wrap gap-2">
                      {interests.length > 0 ? interests.map((interest, i) => (
                        <View key={i} className="px-3 py-1.5 rounded-full bg-white/10 border border-white/5">
                           <Text className="text-white text-[11px] font-bold tracking-wide">{interest}</Text>
                        </View>
                      )) : (
                        <Text className="text-gray-500 text-xs">No interests selected</Text>
                      )}
                   </View>
                </View>
             </View>
          </Animated.View>

          {/* Action Buttons */}
          <Animated.View entering={FadeInUp.delay(700)} className="px-6 mb-10 gap-3">
             {/* Edit Profile */}
             <TouchableOpacity 
                onPress={() => navigation.navigate("ProfileSetup", { user })}
                className="w-full py-3 bg-[#1c1c24]/80 border border-white/5 rounded-2xl items-center justify-center"
             >
                <View className="flex-row items-center gap-2">
                   <Ionicons name="create-outline" size={18} color="#a855f7" />
                   <Text className="text-white text-[14px] font-bold">Edit Profile</Text>
                </View>
             </TouchableOpacity>

             {/* View My Plans */}
             <TouchableOpacity 
                onPress={() => { setPlansModalType("all"); setShowPlansModal(true); }}
                className="w-full py-3 bg-[#1c1c24]/80 border border-white/5 rounded-2xl items-center justify-center"
             >
                <View className="flex-row items-center gap-2">
                   <Ionicons name="calendar-outline" size={18} color="#22d3ee" />
                   <Text className="text-white text-[14px] font-bold">My Events</Text>
                </View>
             </TouchableOpacity>

             {/* View Reviews */}
             <TouchableOpacity 
                onPress={() => navigation.navigate("Credibility")}
                className="w-full py-3 bg-[#1c1c24]/80 border border-white/5 rounded-2xl items-center justify-center"
             >
                <View className="flex-row items-center gap-2">
                   <Ionicons name="star-outline" size={18} color="#fbbf24" />
                   <Text className="text-white text-[14px] font-bold">Reviews & Ratings</Text>
                </View>
             </TouchableOpacity>

             {/* Logout Button */}
             <TouchableOpacity 
                onPress={handleLogout}
                className="w-full py-3 bg-red-500/20 border border-red-500/30 rounded-2xl items-center justify-center mt-2"
             >
                <View className="flex-row items-center gap-2">
                   <Ionicons name="log-out-outline" size={18} color="#ef4444" />
                   <Text className="text-red-500 text-[14px] font-bold">Logout</Text>
                </View>
             </TouchableOpacity>
          </Animated.View>

        </ScrollView>

        {/* Plans Modal */}
        <Modal
          visible={showPlansModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowPlansModal(false)}
        >
          <View className="flex-1 bg-black/80 justify-end">
            <TouchableOpacity 
              activeOpacity={1}
              onPress={() => setShowPlansModal(false)}
              className="absolute inset-0"
            />
            
            <Animated.View 
              entering={FadeInDown}
              className="bg-[#1c1c24] border-t border-white/10 rounded-t-[30px] p-6 h-[75%] w-full"
            >
              {/* Ambient Glows (Stable) */}
              <View className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-indigo-600/[0.05] rounded-full" />
              <View className="absolute bottom-[20%] right-[-10%] w-64 h-64 bg-indigo-900/[0.05] rounded-full" />
              <View className="absolute top-[40%] right-[-5%] w-48 h-48 bg-slate-800/[0.05] rounded-full" />
              <View className="absolute top-[60%] left-[-10%] w-56 h-56 bg-slate-900/[0.05] rounded-full" />
              <View className="items-center mb-6">
                <View className="w-12 h-1.5 bg-white/20 rounded-full mb-4" />
                <Text className="text-xl font-bold text-white tracking-wide">
                  {plansModalType === "joined" ? "Events Joined" : plansModalType === "created" ? "Events Created" : "My Events"}
                </Text>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, gap: 12 }}>
                {getFilteredPlans().length > 0 ? (
                  getFilteredPlans().map((plan, index) => {
                    const activityIcon = getActivityIcon(plan);
                    const eventDate = plan?.date ? new Date(plan.date).toLocaleDateString() : "Upcoming";
                    return (
                      <TouchableOpacity 
                        key={plan._id || index}
                        onPress={() => {
                          setShowPlansModal(false);
                          setTimeout(() => {
                            navigation.navigate("PlanDetail", { planId: plan._id });
                          }, 300);
                        }}
                        className="bg-white/5 border border-white/10 rounded-2xl p-4 flex-row items-center gap-4"
                      >
                        <View className="w-[45px] h-[45px] rounded-xl items-center justify-center" style={{ backgroundColor: `${activityIcon.color}20` }}>
                           <FontAwesome5 name={activityIcon.name} size={16} color={activityIcon.color} />
                        </View>
                        <View className="flex-1 justify-center">
                           <Text className="text-white text-[15px] font-bold mb-0.5" numberOfLines={1}>{plan.title}</Text>
                           <Text className="text-gray-400 text-[12px]" numberOfLines={1}>
                             {plan.creatorId?._id === user?._id ? "Hosted event" : "Joined as attendee"} • {eventDate}
                           </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color="#6b7280" />
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <View className="items-center justify-center py-10 mt-10 opacity-60">
                    <Ionicons name="calendar-outline" size={48} color="#9ca3af" style={{ marginBottom: 16 }} />
                    <Text className="text-gray-300 text-base font-semibold">No events found.</Text>
                  </View>
                )}
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>
      </SafeAreaView>
    </AnimatedBackground>
  );
}
