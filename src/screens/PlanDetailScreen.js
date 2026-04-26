import { useAuth } from "../context/AuthContext";
import { joinPlan, getPlanById, endPlan, savePlan, unsavePlan } from "../api/planService";
import { createReview, hasReviewed } from "../api/reviewService";
import ReviewModal from "../components/ReviewModal";
import ParticipantReviewList from "../components/ParticipantReviewList";
import { useFocusEffect } from "@react-navigation/native";
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  Share,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import LinearGradient from "react-native-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { Alert, ActivityIndicator, Linking } from "react-native";
import appConfig from "../config/appConfig";


const { height } = Dimensions.get("window");

const CATEGORY_STYLES = {
  movie: { label: "Movie", emoji: "🎬", color: "#d946ef", bg: "bg-[#d946ef]/20", text: "text-[#d946ef]", border: "border-[#d946ef]/30" },
  cafe: { label: "Café", emoji: "☕", color: "#6b7280", bg: "bg-gray-500/20", text: "text-gray-400", border: "border-gray-500/30" },
  event: { label: "Event", emoji: "🎉", color: "#ec4899", bg: "bg-[#ec4899]/20", text: "text-[#ec4899]", border: "border-[#ec4899]/30" },
  gaming: { label: "Gaming", emoji: "🎮", color: "#06b6d4", bg: "bg-[#06b6d4]/20", text: "text-[#06b6d4]", border: "border-[#06b6d4]/30" },
  food: { label: "Food", emoji: "🍕", color: "#eab308", bg: "bg-[#eab308]/20", text: "text-[#eab308]", border: "border-[#eab308]/30" },
  sports: { label: "Sports", emoji: "🏃", color: "#3b82f6", bg: "bg-[#3b82f6]/20", text: "text-[#3b82f6]", border: "border-[#3b82f6]/30" },
};

export default function PlanDetailScreen({ route, navigation }) {
  const planFromParams = route?.params?.plan;
  
  if (!planFromParams || !planFromParams._id) {
    return (
      <View className="flex-1 bg-[#0a0a15] items-center justify-center">
        <Text className="text-white text-lg mb-4">Plan not found</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="px-6 py-3 bg-purple-600/20 rounded-full border border-purple-500/30"
        >
          <Text className="text-purple-400 font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { plan } = route.params;
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(plan);
  const [hasJoined, setHasJoined] = useState(
    plan.participants?.some(p => p === user?._id || p._id === user?._id)
  );
  const [isSaved, setIsSaved] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  
  // Review States
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showParticipantList, setShowParticipantList] = useState(false);
  const [targetUserForReview, setTargetUserForReview] = useState(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewedIds, setReviewedIds] = useState([]);
  const [hasCheckedReview, setHasCheckedReview] = useState(false);

  const fetchPlanDetails = async () => {
    try {
      const response = await getPlanById(plan._id);
      if (response.data.success) {
        setCurrentPlan(response.data.data);
        setHasJoined(response.data.data.participants?.some(p => (p?._id || p) === user?._id));
      }
    } catch (error) {
      console.error("Error fetching plan details:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPlanDetails();
    }, [plan._id, user?._id])
  );

  // Check if current user has already reviewed the host (for Joiners)
  const checkJoinerReviewStatus = async () => {
    if (isHost || !hasJoined || hasCheckedReview || currentPlan.status !== 'ended') return;
    try {
      const hostId = currentPlan.createdBy?._id || currentPlan.createdBy;
      const response = await hasReviewed(hostId);
      if (response.data.hasReviewed) {
        setHasCheckedReview(true);
      } else if (isReviewable) {
        setTargetUserForReview(currentPlan.creator || { _id: hostId, name: "the Host" });
        setShowReviewModal(true);
        setHasCheckedReview(true);
      }
    } catch (error) {
      console.error("Error checking review status:", error);
    }
  };

  const isReviewable = (new Date() - new Date(currentPlan.dateTime)) > 1800000; // 30 minutes threshold

  React.useEffect(() => {
    if (currentPlan.status === 'ended' && !isHost && hasJoined) {
      checkJoinerReviewStatus();
    }
  }, [currentPlan.status, isHost, hasJoined]);

  const isHost = currentPlan.createdBy === user?._id || (currentPlan.createdBy?._id || currentPlan.createdBy) === user?._id;

  // Fallbacks for data mapping
  const categoryData = CATEGORY_STYLES[currentPlan.category?.toLowerCase()] || CATEGORY_STYLES.event;
  const planDate = new Date(currentPlan.dateTime || new Date());
  const isToday = planDate.toDateString() === new Date().toDateString();
  const dateStr = isToday ? "Today" : planDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const timeStr = planDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const participantsCount = currentPlan.participants?.length || 0;
  const maxPeople = currentPlan.maxPeople || 4;
  const spotsLeft = Math.max(0, maxPeople - participantsCount);

  const handleJoin = async () => {
    if (hasJoined || isHost) return;
    try {
      setLoading(true);
      await joinPlan(plan._id);
      setHasJoined(true);
      Alert.alert("Success", "You joined the plan!");
    } catch (error) {
       console.error("Join error:", error);
       Alert.alert("Error", error.response?.data?.message || "Failed to join");
    } finally {
      setLoading(false);
    }
  };
  const handleMessage = () => {
    try {
      navigation.navigate("GroupChat", { plan: currentPlan });
    } catch (error) {
      Alert.alert("Error", "Unable to open chat");
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this plan: ${currentPlan.title}\n\nDate: ${new Date(currentPlan.dateTime).toLocaleDateString()}\nLocation: ${currentPlan.location?.address || 'TBD'}\n\nJoin through the EventBuddy app!`,
        title: currentPlan.title,
        url: currentPlan.imageUrl || undefined,
      });
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  const handleSavePlan = async () => {
    try {
      if (isSaved) {
        await unsavePlan(currentPlan._id);
        setIsSaved(false);
        Alert.alert("Success", "Plan removed from saved");
      } else {
        await savePlan(currentPlan._id);
        setIsSaved(true);
        Alert.alert("Success", "Plan saved successfully!");
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || "Failed to save plan";
      Alert.alert("Error", errorMsg);
      console.error("Save error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    }
  };

  const handleGetTickets = async () => {
    if (!currentPlan.ticketUrl) return;
    try {
      const supported = await Linking.canOpenURL(currentPlan.ticketUrl);
      if (supported) {
        await Linking.openURL(currentPlan.ticketUrl);
      } else {
        Alert.alert("Error", "Unable to open booking link");
      }
    } catch (error) {
      console.error("Linking error:", error);
      Alert.alert("Error", "Something went wrong opening the link");
    }
  };

  const handleEndEvent = async () => {
    Alert.alert(
      "End Event",
      "Are you sure you want to end this event? Participants won't be able to join after this.",
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        {
          text: "End Event",
          onPress: async () => {
            try {
              setIsEnding(true);
              await endPlan(plan._id);
              
              if (isReviewable) {
                // If event was long enough, show participant review list instead of just closing
                const participantsToReview = currentPlan.participants.filter(p => (p._id || p) !== user?._id);
                if (participantsToReview.length > 0) {
                  setShowParticipantList(true);
                } else {
                  Alert.alert("Success", "Event has been ended");
                  navigation.goBack();
                }
              } else {
                Alert.alert("Success", "Event has been ended (Too early for reviews)");
                navigation.goBack();
              }
            } catch (error) {
              Alert.alert("Error", "Failed to end event");
              console.error("End event error:", error);
            } finally {
              setIsEnding(false);
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  const handleReviewSubmit = async ({ rating, comment }) => {
    if (!targetUserForReview) return;
    
    try {
      setIsSubmittingReview(true);
      await createReview({
        targetUserId: targetUserForReview._id,
        planId: currentPlan._id,
        rating,
        comment,
      });
      
      setReviewedIds(prev => [...prev, targetUserForReview._id]);
      setShowReviewModal(false);
      Alert.alert("Success", "Thank you for your feedback!");
      
      // If Joiner just reviewed the host, we can go back
      if (!isHost) {
        navigation.goBack();
      }
    } catch (error) {
      console.error("Submit review error:", error);
      Alert.alert("Error", "Failed to submit review");
    } finally {
      setIsSubmittingReview(false);
      setTargetUserForReview(null);
    }
  };

  const initiateParticipantReview = (participant) => {
    setTargetUserForReview(participant);
    setShowReviewModal(true);
  };
  return (
    <View className="flex-1 bg-[#111114]">
      {/* Background Ambience (Fixed stable version) */}
      <View className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-indigo-600/[0.05] rounded-full" />
      <View className="absolute bottom-[20%] right-[-10%] w-64 h-64 bg-slate-800/[0.1] rounded-full" />
      <View className="absolute top-[40%] right-[-5%] w-48 h-48 bg-indigo-900/[0.05] rounded-full" />
      <View className="absolute top-[60%] left-[-10%] w-56 h-56 bg-slate-900/[0.05] rounded-full" />

      {/* Header */}
      <View className="px-6 pt-14 pb-4 z-20 flex-row justify-between items-center">
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center active:bg-white/10"
        >
          <Ionicons name="chevron-back" size={20} color="#9ca3af" />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={handleShare}
          className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center active:bg-white/10"
        >
          <Ionicons name="share-social-outline" size={20} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        className="flex-1 px-6 pb-32" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 220 }}
      >
        {/* Main Hero Card */}
        <Animated.View entering={FadeInDown.delay(100)} className="bg-white/[0.03] rounded-[28px] p-6 mb-5 border border-white/5 shadow-2xl overflow-hidden relative">
          <View className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/[0.03] rounded-full" />

          <View className="flex-row items-center gap-2 mb-4 z-10">
            <View className="w-10 h-10 rounded-[14px] bg-white/[0.03] border border-white/10 items-center justify-center">
               <Text className="text-xl">{categoryData.emoji}</Text>
            </View>
            <View className="px-3 py-1 rounded-full bg-white/[0.03] border border-white/10">
              <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{categoryData.label}</Text>
            </View>
          </View>

          <Text className="text-[22px] font-bold text-white mb-5 leading-8 tracking-tight z-10">
            {currentPlan.title || "Untitled Plan"}
          </Text>

          <View className="flex-col gap-4 z-10">
            {/* Time */}
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-xl bg-blue-600/20 items-center justify-center">
                <Ionicons name="time-outline" size={18} color="#60a5fa" />
              </View>
              <View>
                <Text className="text-[11px] text-gray-400">{dateStr}</Text>
                <Text className="text-[14px] font-bold text-white">{timeStr}</Text>
              </View>
            </View>
            
            {/* Location */}
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-xl bg-cyan-500/20 items-center justify-center">
                <Ionicons name="location-outline" size={18} color="#22d3ee" />
              </View>
              <View className="flex-1">
                <Text className="text-[14px] font-bold text-white" numberOfLines={1}>
                  {currentPlan.location?.address?.split(',')[0] || "No Location Info"}
                </Text>
                <Text className="text-[11px] text-gray-400" numberOfLines={1}>
                  {currentPlan.location?.address || "Address unavailable"}
                </Text>
              </View>
            </View>

            {/* People Status */}
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-xl bg-pink-500/20 items-center justify-center">
                <Ionicons name="people-outline" size={18} color="#f472b6" />
              </View>
              <View>
                <Text className="text-[14px] font-bold text-white">{participantsCount} / {maxPeople} Joined</Text>
                <Text className="text-[11px] text-gray-400">{spotsLeft > 0 ? `${spotsLeft} spots left` : 'Fully booked'}</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Hosted By Section */}
        <Animated.View entering={FadeInDown.delay(150)} className="bg-white/[0.03] rounded-[28px] p-6 mb-5 border border-white/5 shadow-xl">
          <View className="flex-row items-center gap-2 mb-4">
             <Text className="text-xs font-bold text-gray-500 uppercase tracking-[2px]">Conducted by</Text>
          </View>

          <View className="flex-row items-center gap-4">
            <View className="relative">
              <Image 
                 source={{ uri: currentPlan.createdBy?.avatar || appConfig.defaultAvatar }} 
                 className="w-16 h-16 rounded-[20px] border border-white/10"
              />

              <View className="absolute -bottom-1 -right-1 w-[20px] h-[20px] rounded-full bg-[#111114] items-center justify-center border border-white/10 shadow-lg">
                <Ionicons name="shield-checkmark" size={12} color="#94a3b8" />
              </View>
            </View>
            
            <View className="flex-1 justify-center">
              <View className="flex-row items-center gap-2 mb-1">
                <Text className="text-[16px] font-bold text-white tracking-tight">{currentPlan.createdBy?.name || "Buddy"}</Text>
              </View>
              
              <View className="flex-row items-center gap-2 flex-wrap mb-1">
                <View className="px-2 py-[2px] rounded-full bg-amber-500/10 border border-amber-500/20">
                  <Text className="text-[9px] font-bold text-[#D4AF37] uppercase tracking-wider">Verified Organiser</Text>
                </View>
                <View className="px-2 py-[2px] rounded-full bg-white/[0.05] border border-white/10">
                  <Text className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Trusted Tier</Text>
                </View>
              </View>
              <Text className="text-[10px] text-gray-500 font-medium">Professional Host • 5.0 Precision</Text>
            </View>
          </View>
        </Animated.View>

        {/* Participants Section */}
        <Animated.View entering={FadeInDown.delay(200)} className="bg-white/[0.03] rounded-[28px] p-6 mb-5 border border-white/5 shadow-xl">
          <View className="flex-row items-center justify-between mb-5">
            <View className="flex-row items-center gap-2">
               <Text className="text-xs font-bold text-gray-500 uppercase tracking-[2px]">Participants</Text>
            </View>
            <Text className="text-[11px] text-gray-500 font-bold">{participantsCount} / {maxPeople}</Text>
          </View>

          <View className="flex-col gap-3">
             {/* Participants List */}
             {currentPlan.participants && currentPlan.participants.map((participant, index) => {
               const pUser = typeof participant === 'string' ? { _id: participant, name: "Buddy" } : participant;
               const isParticipantHost = (pUser._id || pUser) === (currentPlan.createdBy?._id || currentPlan.createdBy);
               
               return (
                 <View key={pUser._id || index} className="flex-row items-center gap-3 bg-[#1c1c24] rounded-2xl p-3 border border-white/5">
                    <Image 
                      source={{ uri: pUser.avatar || appConfig.defaultAvatar }} 
                      className="w-11 h-11 rounded-xl" 
                    />
                    <View className="flex-1">
                       <View className="flex-row items-center gap-1.5 mb-[2px]">
                          <Text className="font-bold text-white text-[13px]">{pUser.name || "Buddy"}</Text>
                          {pUser.isVerified && (
                            <View className="w-3.5 h-3.5 rounded-full bg-blue-600 items-center justify-center">
                               <Ionicons name="checkmark" size={8} color="white" />
                            </View>
                          )}
                       </View>
                       <Text className="text-[10px] text-gray-400">{pUser.bio?.substring(0, 30) || "Enthusiastic Buddy"} • {pUser.rating || '5.0'} ⭐</Text>
                    </View>
                    {isParticipantHost && (
                      <View className="px-2 py-1 bg-white/[0.05] border border-white/10 rounded-lg">
                         <Text className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Host</Text>
                      </View>
                    )}
                 </View>
               );
             })}

             {/* Empty Slots */}
             {spotsLeft > 0 && (
               <View className="flex-row flex-wrap justify-between pt-2">
                 {[...Array(Math.min(2, spotsLeft))].map((_, index) => (
                   <View key={`empty-${index}`} className="w-[48%] bg-[#1c1c24] rounded-2xl p-4 border border-dashed border-white/10 opacity-70 flex-col items-center justify-center gap-2">
                      <View className="w-10 h-10 rounded-full bg-[#181820] flex items-center justify-center">
                         <Ionicons name="person-add" size={16} color="#6b7280" />
                      </View>
                      <Text className="text-[11px] font-bold text-gray-500">Available</Text>
                   </View>
                 ))}
               </View>
             )}
          </View>
        </Animated.View>

        {/* About Section */}
        <Animated.View entering={FadeInDown.delay(250)} className="bg-white/[0.03] rounded-[28px] p-6 mb-5 border border-white/5 shadow-xl">
          <View className="flex-row items-center gap-2 mb-4">
             <Text className="text-xs font-bold text-gray-500 uppercase tracking-[2px]">About the session</Text>
          </View>
          
          <Text className="text-[13px] text-gray-300 leading-[22px] mb-5">
            {currentPlan.description || "No description provided for this session yet."}
          </Text>

          {currentPlan.category && (
            <View className="flex-row flex-wrap gap-2">
               <View className="px-3 py-1.5 rounded-full bg-[#111118] border border-white/5 flex-row items-center">
                  <Text className="text-[10px] font-bold text-gray-300 capitalize">{currentPlan.category} Session</Text>
               </View>
               <View className="px-3 py-1.5 rounded-full bg-[#111118] border border-white/5 flex-row items-center">
                  <Ionicons name="people" size={12} color="#22d3ee" className="mr-1" />
                  <Text className="text-[10px] font-bold text-gray-300 ml-1">Limited Capacity</Text>
               </View>
            </View>
          )}
        </Animated.View>

        {/* Safety Section (Muted Luxury) */}
        <Animated.View entering={FadeInDown.delay(300)} className="bg-white/[0.02] rounded-[28px] p-5 border border-white/5 shadow-xl mb-4">
          <View className="flex-row gap-3">
             <View className="w-10 h-10 rounded-[14px] bg-white/[0.03] items-center justify-center border border-white/10">
                <Ionicons name="shield-checkmark-outline" size={20} color="#94a3b8" />
             </View>
             <View className="flex-1 justify-center">
                <Text className="text-[14px] font-bold text-white mb-0.5 tracking-tight">Vetted Community</Text>
                <Text className="text-[11px] text-gray-500 leading-4 font-medium">
                   Premium security protocols in place. Every member is verified for a prestigious experience.
                </Text>
             </View>
          </View>
        </Animated.View>

      </ScrollView>

      {/* Floating CTA Footer (Outside ScrollView) */}
      <Animated.View entering={FadeInUp.delay(400)} className="absolute bottom-0 w-full pt-4 px-6 bg-gradient-to-t from-[#111114] via-[#111114] to-[#111114]/80 border-t border-white/5" style={{ paddingBottom: Platform.OS === 'ios' ? 34 : 24, paddingTop: 24, minHeight: 180 }}>
        {/* Host Controls - Show when user is host */}
        {isHost && (
          <View className="mb-4">
            <TouchableOpacity
              onPress={handleEndEvent}
              disabled={isEnding}
              activeOpacity={0.9}
              className="w-full rounded-[20px] overflow-hidden border border-red-500/20 shadow-xl"
              style={{
                elevation: 10,
                shadowColor: '#ef4444',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.2,
                shadowRadius: 10,
              }}
            >
              <LinearGradient
                colors={['#1f2937', '#0f172a']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 20 }}
              >
                {isEnding ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white text-[15px] font-bold mr-2 tracking-[2px] uppercase">End Event</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Ticket Button for Official Events */}
        {currentPlan.isOfficial && currentPlan.ticketUrl && (
          <View className="mb-4">
            <TouchableOpacity
              onPress={handleGetTickets}
              activeOpacity={0.9}
              className="w-full rounded-[20px] overflow-hidden border border-amber-500/30 shadow-2xl"
              style={{
                elevation: 15,
                shadowColor: '#D4AF37',
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.4,
                shadowRadius: 15,
              }}
            >
              <LinearGradient
                colors={['#D4AF37', '#996515']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ height: 62, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 20 }}
              >
                <Ionicons name="ticket" size={22} color="white" style={{ marginRight: 8 }} />
                <Text className="text-white text-[16px] font-black ml-2 tracking-[3px] uppercase">Get Tickets Now</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Main Actions */}
        <View className="flex-row gap-3 items-center justify-center">
          <TouchableOpacity 
            onPress={handleJoin}
            disabled={loading || hasJoined || isHost || spotsLeft === 0}
            activeOpacity={0.9} 
            className={`flex-1 border border-pink-500/20 shadow-xl ${(hasJoined || isHost || spotsLeft === 0) ? 'opacity-50' : ''}`} 
            style={{ 
              borderRadius: 20, 
              overflow: 'hidden',
              elevation: 12,
              shadowColor: '#f472b6',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
            }}>
            <LinearGradient
              colors={hasJoined || isHost ? ['#1f2937', '#0f172a'] : ['#6366f1', '#4338ca']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 24 }}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text className="text-white text-[15px] font-bold tracking-[2px] uppercase">
                    {isHost ? "Principal Host" : hasJoined ? "Already Joined" : spotsLeft === 0 ? "Fully Booked" : "Secure My Spot"}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
          
          {/* Message Button */}
          <TouchableOpacity 
            onPress={handleMessage}
            activeOpacity={0.8}
            className="w-[60px] h-[60px] bg-white/[0.03] border border-white/10 items-center justify-center shadow-lg" 
            style={{ borderRadius: 24 }}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color="#9ca3af" />
          </TouchableOpacity>
          
          {/* Save Button */}
          <TouchableOpacity 
            onPress={handleSavePlan}
            activeOpacity={0.8}
            className={`w-[60px] h-[60px] items-center justify-center shadow-lg border ${isSaved ? 'bg-white/[0.08] border-white/20' : 'bg-white/[0.03] border-white/10'}`}
            style={{ borderRadius: 24 }}>
            <Ionicons 
              name={isSaved ? "bookmark" : "bookmark-outline"} 
              size={20} 
              color={isSaved ? "#ffffff" : "#6b7280"} 
            />
          </TouchableOpacity>
        </View>
      </Animated.View>
      
      {/* Review Modals */}
      <ReviewModal 
        isVisible={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSubmit={handleReviewSubmit}
        targetName={targetUserForReview?.name}
        isSubmitting={isSubmittingReview}
      />

      <ParticipantReviewList
        isVisible={showParticipantList}
        onClose={() => {
          setShowParticipantList(false);
          navigation.goBack();
        }}
        participants={currentPlan.participants?.filter(p => (p._id || p) !== user?._id)}
        onReviewParticipant={initiateParticipantReview}
        reviewedIds={reviewedIds}
      />
    </View>
  );
}
