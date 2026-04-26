import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity,  Image, SafeAreaView, Platform, ActivityIndicator } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useAuth } from "../context/AuthContext";
import { getUserBadges } from "../api/badgeService";
import { getUserRating } from "../api/reviewService";
import LinearGradient from "react-native-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";
import Animated, { FadeInUp, FadeInDown } from "react-native-reanimated";
import AnimatedBackground from "../components/AnimatedBackground";
import { getLeaderboard } from "../api/userService";
import appConfig from "../config/appConfig";

export default function CredibilityScreen({ navigation }) {
  const { user } = useAuth();
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(15); // Default rank


  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user?._id) {
          const [badgeRes, ratingRes, leaderboardRes] = await Promise.all([
            getUserBadges(user._id).catch(() => ({ data: { data: { badges: [] } } })),
            getUserRating(user._id).catch(() => ({ data: { averageRating: 0 } })),
            getLeaderboard(20).catch(() => ({ data: { data: [] } }))
          ]);
          setBadges(badgeRes.data?.data?.badges || []);
          setRating(ratingRes.data?.averageRating || 0);
          
          const lbData = leaderboardRes.data?.data || [];
          setLeaderboard(lbData.slice(0, 3));
          
          const myRank = lbData.findIndex(u => u._id === user._id);
          if (myRank !== -1) {
            setUserRank(myRank + 1);
          } else {
            setUserRank(lbData.length > 0 ? "20+" : "15");
          }
        }
      } catch (err) {
        console.error("Error fetching credibility data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?._id]);



  const eventsJoined = user?.joinedPlans?.length || 0;
  const eventsCreated = user?.createdPlans?.length || 0;
  
  // Base 70 + Rating contribution + Activity contribution
  const trustScore = 70 + (rating * 2) + Math.min((eventsJoined * 2) + (eventsCreated * 5), 20);
  const clampedScore = Math.floor(Math.min(trustScore, 99));

  const lockedBadges = [
    { id: 1, title: "Legend", description: "Attend 25 events", progress: eventsJoined, max: 25, colors: ['#b428d4', '#06b6d4'], icon: "🏆" },
    { id: 2, title: "Host with Most", description: "Host 10 events", progress: eventsCreated, max: 10, colors: ['#06b6d4', '#ec4899'], icon: "💫" },
  ];
  return (
    <AnimatedBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <View className="px-5 pt-3 mb-6 flex-row items-center justify-between z-10" style={{ paddingTop: Platform.OS === 'android' ? 40 : 12 }}>
           <TouchableOpacity 
              onPress={() => navigation.goBack()}
              className="w-10 h-10 rounded-full bg-[#1c1c24] border border-white/5 flex items-center justify-center shadow-lg"
           >
              <Ionicons name="chevron-back" size={22} color="white" />
           </TouchableOpacity>

           <Text className="text-[18px] font-bold text-white tracking-wide">Your Credibility 🏆</Text>

           <TouchableOpacity className="w-10 h-10 rounded-full bg-[#1c1c24] border border-white/5 flex items-center justify-center shadow-lg">
              <Ionicons name="ellipsis-vertical" size={20} color="white" />
           </TouchableOpacity>
        </View>

        <ScrollView 
            className="flex-1" 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 20 }}
        >
          {/* Trust Score Header */}
          <Animated.View entering={FadeInDown.delay(100)} className="mb-10">
            <View className="bg-[#1c1c24]/80 border border-white/5 rounded-3xl p-6 overflow-hidden">
                <View className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl" />
                
                <View className="flex-row items-center gap-6 z-10">
                    {/* Clean Trust Score Ring */}
                    <View style={{
                        width: 110, height: 110,
                        borderRadius: 55,
                        borderWidth: 8,
                        borderColor: '#b428d4',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#111114',
                        shadowColor: '#b428d4',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.6,
                        shadowRadius: 12,
                        elevation: 8,
                    }}>
                        <View style={{
                            position: 'absolute', width: 110, height: 110, borderRadius: 55,
                            borderWidth: 8, borderColor: '#06b6d4', borderTopColor: 'transparent',
                            borderRightColor: 'transparent',
                            transform: [{ rotate: `${(clampedScore / 100) * 360 - 225}deg` }]
                        }} />
                        <Text style={{ fontSize: 30, fontWeight: '900', color: 'white', lineHeight: 34 }}>{clampedScore}</Text>
                        <Text style={{ fontSize: 9, color: '#9ca3af', fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>Trust Score</Text>
                    </View>

                    <View className="flex-1">
                        <Text className="text-[22px] font-bold text-white mb-2 leading-tight">Your Credibility 🏆</Text>
                        <Text className="text-gray-400 text-[13px] mb-4">You're in the top {100 - clampedScore + 5}% of trusted users!</Text>
                        <View className="flex-row gap-2 flex-wrap">
                            <View className="px-3 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/30">
                                <Text className="text-[#c084fc] text-[11px] font-bold tracking-wide">{badges.length} Earned</Text>
                            </View>
                            <View className="px-3 py-1.5 rounded-full bg-white/10 border border-white/5">
                                <Text className="text-gray-300 text-[11px] font-bold tracking-wide">{lockedBadges.length} Locked</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
          </Animated.View>

          {/* Earned Badges */}
          <Animated.View entering={FadeInUp.delay(200)} className="mb-10">
            <View className="flex-row items-center gap-2 mb-4">
                <Text className="text-[18px] font-bold text-white tracking-wide">Your Badges</Text>
                <Text className="text-gray-400 text-[14px]">({badges.length})</Text>
            </View>

            <View className="flex-row flex-wrap justify-between gap-y-4">
                {loading ? (
                    <ActivityIndicator size="small" color="#a855f7" />
                ) : badges.length > 0 ? badges.map((badge, index) => (
                    <TouchableOpacity 
                        key={badge._id || index} 
                        className="w-[48%] bg-[#1c1c24]/80 border border-purple-500/30 shadow-md rounded-3xl p-5 items-center justify-center"
                        style={{
                            elevation: 5,
                            shadowColor: '#a855f7',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.2,
                            shadowRadius: 10,
                        }}
                    >
                        <View className="w-14 h-14 rounded-2xl bg-purple-500/20 items-center justify-center mb-3">
                            <Text className="text-[24px]">⭐</Text>
                        </View>
                        <Text className="text-white text-[13px] font-bold text-center mb-1">{badge.name}</Text>
                        <Text className="text-gray-400 text-[10px] text-center">Earned on your journey</Text>
                    </TouchableOpacity>
                )) : (
                    <Text className="text-gray-500 text-sm ml-2">No badges earned yet. Join more events!</Text>
                )}
            </View>
          </Animated.View>

          {/* Locked Badges */}
          <Animated.View entering={FadeInUp.delay(300)} className="mb-10">
            <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center gap-2">
                    <Text className="text-[18px] font-bold text-white tracking-wide">Locked Badges</Text>
                    <Text className="text-gray-400 text-[14px]">({lockedBadges.length})</Text>
                </View>
            </View>

            <View className="flex-row flex-wrap justify-between gap-y-4">
                {lockedBadges.map((badge) => {
                    const percent = Math.min(Math.round((badge.progress / badge.max) * 100), 100);
                    return (
                        <TouchableOpacity key={badge.id} style={{ width: '48%', backgroundColor: 'rgba(28,28,36,0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 24, padding: 20, alignItems: 'center', justifyContent: 'center' }}>
                            <View style={{ position: 'relative', width: 56, height: 56, marginBottom: 12 }}>
                                <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' }}>
                                    <Text style={{ fontSize: 24, opacity: 0.35 }}>{badge.icon}</Text>
                                </View>
                                <View style={{ position: 'absolute', bottom: -4, right: -4, width: 20, height: 20, borderRadius: 10, backgroundColor: '#1c1c24', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)' }}>
                                    <Ionicons name="lock-closed" size={10} color="#6b7280" />
                                </View>
                            </View>
                            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '700', textAlign: 'center', marginBottom: 4 }}>{badge.title}</Text>
                            <Text style={{ color: '#6b7280', fontSize: 10, textAlign: 'center', marginBottom: 12 }}>{badge.description}</Text>
                            <View style={{ width: '100%', height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden', marginBottom: 4 }}>
                                <LinearGradient colors={badge.colors} start={{x:0, y:0}} end={{x:1, y:0}} style={{ height: '100%', width: `${percent}%`, borderRadius: 3 }} />
                            </View>
                            <Text style={{ color: '#6b7280', fontSize: 9, fontWeight: '600' }}>{badge.progress}/{badge.max}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
          </Animated.View>

          {/* Badge Categories */}
          <Animated.View entering={FadeInUp.delay(400)} className="mb-10">
             <Text className="text-[18px] font-bold text-white tracking-wide mb-4">Browse by Category</Text>
             <View className="flex-row flex-wrap justify-between gap-y-3">
                <TouchableOpacity className="w-[48%] bg-[#1c1c24]/80 border border-white/5 rounded-2xl p-3 flex-row items-center gap-3">
                    <View className="w-[40px] h-[40px] rounded-xl bg-purple-500/20 items-center justify-center">
                        <Text className="text-[18px]">🎯</Text>
                    </View>
                    <View className="flex-1">
                        <Text className="text-white text-[13px] font-bold mb-0.5">Achievement</Text>
                        <Text className="text-gray-400 text-[10px]">6 badges</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity className="w-[48%] bg-[#1c1c24]/80 border border-white/5 rounded-2xl p-3 flex-row items-center gap-3">
                    <View className="w-[40px] h-[40px] rounded-xl bg-cyan-500/20 items-center justify-center">
                        <Text className="text-[18px]">👥</Text>
                    </View>
                    <View className="flex-1">
                        <Text className="text-white text-[13px] font-bold mb-0.5">Social</Text>
                        <Text className="text-gray-400 text-[10px]">4 badges</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity className="w-[48%] bg-[#1c1c24]/80 border border-white/5 rounded-2xl p-3 flex-row items-center gap-3">
                    <View className="w-[40px] h-[40px] rounded-xl bg-pink-500/20 items-center justify-center">
                        <Text className="text-[18px]">⚡</Text>
                    </View>
                    <View className="flex-1">
                        <Text className="text-white text-[13px] font-bold mb-0.5">Activity</Text>
                        <Text className="text-gray-400 text-[10px]">3 badges</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity className="w-[48%] bg-[#1c1c24]/80 border border-white/5 rounded-2xl p-3 flex-row items-center gap-3">
                    <LinearGradient colors={['rgba(180,40,212,0.25)', 'rgba(6,182,212,0.25)']} start={{x:0, y:0}} end={{x:1, y:1}} style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                        <Text className="text-[18px]">💎</Text>
                    </LinearGradient>
                    <View className="flex-1">
                        <Text className="text-white text-[13px] font-bold mb-0.5">Exclusive</Text>
                        <Text className="text-gray-400 text-[10px]">2 badges</Text>
                    </View>
                </TouchableOpacity>
             </View>
          </Animated.View>

          {/* Leaderboard */}
          <Animated.View entering={FadeInUp.delay(500)} className="mb-4">
             <View className="bg-[#1c1c24]/80 border border-white/5 rounded-3xl p-6 overflow-hidden">
                <View className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl" />
                
                <View className="flex-row items-center justify-between mb-5 z-10">
                    <Text className="text-[18px] font-bold text-white tracking-wide">Badge Leaderboard</Text>
                    <TouchableOpacity>
                       <Text className="text-[13px] font-bold text-[#22d3ee]">View All</Text>
                    </TouchableOpacity>
                </View>

                {/* Dynamic Leaders */}
                {leaderboard.map((leader, index) => (
                  <View key={`leader-${leader._id || index}`} className="flex-row items-center gap-3 mb-4 z-10">
                      <View className={`w-8 h-8 rounded-full ${index === 0 ? 'bg-[#eab308]' : index === 1 ? 'bg-[#9ca3af]' : 'bg-[#d97706]'} items-center justify-center`}>
                          <Text className="text-white font-black text-[12px]">{index + 1}</Text>
                      </View>
                      <Image 
                        source={{ uri: leader.avatar || appConfig.defaultAvatar }} 
                        className="w-10 h-10 rounded-full" 
                      />
                      <View className="flex-1 flex-col">
                          <Text className="text-white text-[14px] font-bold mb-0.5">{leader.name || "Anonymous"}</Text>
                          <Text className="text-gray-400 text-[11px]">{leader.badgeCount || 0} badges earned</Text>
                      </View>
                      <Text className="text-[20px]">{index === 0 ? "🏆" : index === 1 ? "🥈" : "🥉"}</Text>
                  </View>
                ))}

                {!leaderboard.length && !loading && (
                    <Text className="text-gray-500 text-xs text-center py-4">No leaderboard data found</Text>
                )}

                {/* Current User */}
                <View className="flex-row items-center gap-3 pt-4 mt-2 border-t border-white/10 z-10">
                    <View className="w-8 h-8 rounded-full bg-white/10 items-center justify-center border border-white/5">
                        <Text className="text-white font-black text-[12px]">{userRank}</Text>
                    </View>
                    <View className="w-10 h-10 rounded-full border-2 border-pink-500 overflow-hidden">
                        <Image source={{ uri: user?.avatar || appConfig.defaultAvatar }} className="w-full h-full" />
                    </View>

                    <View className="flex-1 flex-col">
                        <Text className="text-white text-[14px] font-bold mb-0.5">You</Text>
                        <Text className="text-gray-400 text-[11px]">{badges.length} badges earned</Text>
                    </View>
                    <Text className="text-[18px]">⭐</Text>
                </View>
             </View>
          </Animated.View>

        </ScrollView>
      </SafeAreaView>
    </AnimatedBackground>
  );
}
