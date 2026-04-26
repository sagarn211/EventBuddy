import React, { useState, useCallback, useEffect, useRef } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { getPlans } from "../api/planService";
import { getActiveBuddies, getContacts } from "../api/userService";
import { getBuddies } from "../api/friendshipService";
import appConfig from "../config/appConfig";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  
  Image,
  SafeAreaView,
  ActivityIndicator
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import LinearGradient from "react-native-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";



const CHATS = [
  {
    id: "g1",
    title: "Dune Watch Party",
    isGroup: true,
    avatars: [
      "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg",
      "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-5.jpg"
    ],
    lastMessage: "Alex: I'll grab popcorn for everyone!",
    time: "2:47 PM",
    unread: 3,
    typing: false,
    color: "#b428d4"
  },
  {
    id: "u1",
    title: "Sarah Kim",
    isGroup: false,
    avatars: ["https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-5.jpg"],
    lastMessage: "Are we still meeting at 7?",
    time: "1:20 PM",
    unread: 1,
    typing: true,
    color: "#ec4899"
  },
  {
    id: "g2",
    title: "Weekend Hiking 🏔️",
    isGroup: true,
    avatars: [
      "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg",
      "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg"
    ],
    lastMessage: "Mike: I have space in my car.",
    time: "Yesterday",
    unread: 0,
    typing: false,
    color: "#06b6d4"
  },
  {
    id: "u2",
    title: "Alex Chen",
    isGroup: false,
    avatars: ["https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg"],
    lastMessage: "You: Sounds good! 👍",
    time: "Mon",
    unread: 0,
    typing: false,
    color: "#3b82f6"
  }
];

export default function ChatListScreen({ navigation }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [chats, setChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [buddies, setBuddies] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const onlineUsersRef = useRef(new Set());

  const filterChats = (text, allChats) => {
    setSearchText(text);
    if (!text) {
      setFilteredChats(allChats);
      return;
    }
    const filtered = allChats.filter(chat => 
      chat.title.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredChats(filtered);
  };

  // Fetch active buddies
  const fetchActiveBuddies = useCallback(async () => {
    try {
      console.log("Fetching buddies...");
      const response = await getBuddies();
      const buddiesList = response.data?.data || [];
      setBuddies(buddiesList);

    } catch (error) {
      console.error("Error fetching active buddies:", error);
      console.error("Error status:", error.response?.status);
      console.error("Error data:", error.response?.data);
      console.error("Error message:", error.message);
      // Show empty list if fetch fails
      setBuddies([]);
    }
  }, []);

  // Setup socket listeners for online status
  useEffect(() => {
    if (!socket || !user?._id) return;

    // Listen for user coming online
    const handleUserOnline = (data) => {
      onlineUsersRef.current.add(data.userId);
      setOnlineUsers(new Set(onlineUsersRef.current));
    };

    // Listen for user going offline
    const handleUserOffline = (data) => {
      onlineUsersRef.current.delete(data.userId);
      setOnlineUsers(new Set(onlineUsersRef.current));
    };

    // Listen for active users list on connection
    const handleActiveUsers = (data) => {
      onlineUsersRef.current = new Set(data.users || []);
      setOnlineUsers(new Set(onlineUsersRef.current));
    };

    socket.on("user-online", handleUserOnline);
    socket.on("user-offline", handleUserOffline);
    socket.on("active-users", handleActiveUsers);

    return () => {
      socket.off("user-online", handleUserOnline);
      socket.off("user-offline", handleUserOffline);
      socket.off("active-users", handleActiveUsers);
    };
  }, [socket, user?._id]);

  useFocusEffect(
    useCallback(() => {
      const fetchUserChats = async () => {
        try {
          setLoading(true);
          const response = await getPlans();
          const joinedPlans = (response.data.data || []).filter(plan => 
            plan.participants?.some(p => p === user?._id || p._id === user?._id) || plan.createdBy === user?._id
          );
          setChats(joinedPlans);
          setFilteredChats(joinedPlans);
          
          // Also fetch active buddies
          await fetchActiveBuddies();
        } catch (error) {
          console.error("Error fetching user chats:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchUserChats();
    }, [user?._id, fetchActiveBuddies])
  );

  const handleBuddyPress = (buddy) => {
    // Navigate to direct chat with the buddy
    navigation.navigate("DirectChat", { 
      buddy: buddy,
      buddyId: buddy._id || buddy.id
    });
  };

  const handleEditPress = () => {
    // Navigate to new message composition screen
    navigation.navigate("NewMessage");
  };

  const handleAddBox = () => {
    // Navigate to add story/box or add buddy screen
    navigation.navigate("AddStory");
  };

  const CATEGORY_COLORS = {
    movie: '#d946ef', cafe: '#fb923c', event: '#3b82f6',
    gaming: '#4ade80', food: '#eab308', sports: '#60a5fa', default: '#818cf8'
  };

  const getCategoryColor = (cat) => CATEGORY_COLORS[cat?.toLowerCase()] || CATEGORY_COLORS.default;

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a15' }}>
      {/* Ambient Glows (Stable) */}
      <View className="absolute top-[-5%] left-[-15%] w-72 h-72 bg-indigo-600/[0.05] rounded-full" />
      <View className="absolute top-[30%] right-[-10%] w-64 h-64 bg-slate-800/[0.05] rounded-full" />
      <View className="absolute bottom-[10%] left-[20%] w-48 h-48 bg-indigo-900/[0.05] rounded-full" />

      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <View className="flex-row items-center justify-between mb-5">
            <View>
              <View className="flex-row items-center gap-2 mb-1">
                <View className="w-2 h-2 rounded-full bg-emerald-500" />
                <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-[3px]">Live Chat</Text>
              </View>
              <Text className="text-3xl font-extrabold text-white tracking-tight">Messages</Text>
            </View>
            <TouchableOpacity 
              onPress={handleEditPress}
              className="w-11 h-11 items-center justify-center rounded-2xl bg-gray-800 border border-gray-700 relative"
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={20} color="#818cf8" />
              <View className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View className="flex-row items-center bg-gray-800 border border-gray-700 rounded-2xl px-4 h-12 mb-2">
            <Ionicons name="search" size={18} color="#6b7280" />
            <TextInput 
              placeholder="Search chats, plans..."
              placeholderTextColor="#6b7280"
              className="flex-1 ml-3 text-white font-medium text-[14px]"
              value={searchText}
              onChangeText={(text) => filterChats(text, chats)}
            />
            <Ionicons name="mic-outline" size={18} color="#6b7280" />
          </View>
        </View>

        <ScrollView 
          style={{ flex: 1 }} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {/* Active Buddies Horizontal List */}
          {buddies.length > 0 && (
            <View className="mb-4">
              <View className="flex-row items-center justify-between px-6 mb-3">
                <Text className="text-[13px] font-bold text-white uppercase tracking-[2px]">Active Buddies</Text>
                <Text className="text-[11px] text-indigo-400 font-bold">{buddies.length} online</Text>
              </View>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
              >
                {/* Add Story */}
                <TouchableOpacity onPress={handleAddBox} activeOpacity={0.7} className="items-center">
                  <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#1e1e30', borderWidth: 1.5, borderColor: '#818cf8', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                    <Ionicons name="add" size={22} color="#818cf8" />
                  </View>
                  <Text className="text-[11px] font-semibold text-indigo-400">Add Story</Text>
                </TouchableOpacity>

                {buddies.map((buddy, index) => (
                  <Animated.View key={buddy._id || buddy.id} entering={FadeInRight.delay(index * 80).duration(400)}>
                    <TouchableOpacity onPress={() => handleBuddyPress(buddy)} className="items-center" activeOpacity={0.8}>
                      <View style={{ width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 6, position: 'relative' }}>
                        {/* Story ring or plain border */}
                        {buddy.hasStory ? (
                          <LinearGradient 
                            colors={['#4f46e5', '#818cf8']} 
                            style={{ position: 'absolute', inset: 0, borderRadius: 32, width: 64, height: 64 }} 
                          />
                        ) : null}
                        <View style={{ width: buddy.hasStory ? 58 : 64, height: buddy.hasStory ? 58 : 64, borderRadius: 30, overflow: 'hidden', borderWidth: buddy.hasStory ? 2 : 1, borderColor: buddy.hasStory ? '#0a0a15' : '#374151', backgroundColor: '#111' }}>
                          <Image source={{ uri: buddy.avatar || appConfig.defaultAvatar }} style={{ width: '100%', height: '100%' }} />
                        </View>
                        {onlineUsers.has(buddy._id) && (
                          <View style={{ position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: '#10b981', borderWidth: 2, borderColor: '#0a0a15', zIndex: 20 }} />
                        )}
                      </View>
                      <Text className="text-[11px] font-bold text-gray-300" numberOfLines={1} style={{ maxWidth: 64 }}>
                        {buddy.firstName || buddy.name?.split(' ')[0]}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Chats List */}
          <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
            <View className="flex-row items-center justify-between mb-4 px-1">
              <Text className="text-[13px] font-bold text-white uppercase tracking-[2px]">Group Chats</Text>
              <Text className="text-[11px] text-gray-500">{filteredChats.length} active</Text>
            </View>

            {loading ? (
              <View className="items-center justify-center py-20">
                <ActivityIndicator size="large" color="#818cf8" />
                <Text className="text-gray-500 mt-4 text-[12px] uppercase tracking-widest font-bold">Loading Chats...</Text>
              </View>
            ) : filteredChats.length > 0 ? filteredChats.map((chat, index) => {
              const catColor = getCategoryColor(chat.category);
              const participantCount = chat.participants?.length || 0;
              // Get up to 2 participant avatars
              const p1 = chat.participants?.[0];
              const p2 = chat.participants?.[1];
              const avatar1 = (typeof p1 === 'object' && p1?.avatar) ? p1.avatar : appConfig.defaultAvatar;
              const avatar2 = (typeof p2 === 'object' && p2?.avatar) ? p2.avatar : appConfig.defaultAvatar;
              
              return (
                <Animated.View key={chat._id} entering={FadeInDown.delay(index * 100).duration(500)}>
                  <TouchableOpacity 
                    onPress={() => navigation.navigate("GroupChat", { plan: chat })}
                    activeOpacity={0.85}
                    style={{ marginBottom: 12 }}
                  >
                    <View style={{ backgroundColor: '#111827', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: '#1f2937', flexDirection: 'row', alignItems: 'center' }}>
                      {/* Left Color Bar */}
                      <View style={{ width: 3, height: 48, borderRadius: 2, backgroundColor: catColor, marginRight: 12, opacity: 0.8 }} />

                      {/* Overlapping Avatars */}
                      <View style={{ width: 52, height: 44, marginRight: 14, position: 'relative' }}>
                        {/* Bottom-left avatar (participant 2) */}
                        <Image 
                          source={{ uri: avatar2 }}
                          style={{ 
                            position: 'absolute', bottom: 0, left: 0,
                            width: 34, height: 34, borderRadius: 17,
                            borderWidth: 2, borderColor: '#111827', zIndex: 1
                          }} 
                        />
                        {/* Top-right avatar (participant 1) */}
                        <Image 
                          source={{ uri: avatar1 }}
                          style={{ 
                            position: 'absolute', top: 0, right: 0,
                            width: 34, height: 34, borderRadius: 17,
                            borderWidth: 2, borderColor: '#111827', zIndex: 2
                          }} 
                        />
                      </View>

                      {/* Chat Info */}
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <Text style={{ color: 'white', fontWeight: '700', fontSize: 15, maxWidth: '72%' }} numberOfLines={1}>
                            {chat.title}
                          </Text>
                          <Text style={{ color: '#6b7280', fontSize: 10, fontWeight: '600' }}>
                            {new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text style={{ color: '#9ca3af', fontSize: 12, flex: 1, marginRight: 8 }} numberOfLines={1}>
                            {chat.description ? chat.description.substring(0, 40) + '…' : '💬 Tap to join the conversation'}
                          </Text>
                          {/* Participant count badge */}
                          <View style={{ backgroundColor: catColor + '22', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: catColor + '40' }}>
                            <Text style={{ color: catColor, fontSize: 10, fontWeight: '700' }}>{participantCount} 👥</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            }) : (
              <View className="items-center justify-center py-20">
                <View className="w-20 h-20 rounded-full bg-gray-800 border border-gray-700 items-center justify-center mb-5">
                  <Ionicons name="chatbubbles-outline" size={36} color="#4b5563" />
                </View>
                <Text className="text-white font-bold text-lg mb-2">No active chats</Text>
                <Text className="text-gray-500 text-sm text-center px-8">Join a plan to unlock the group chat and start your conversation!</Text>
              </View>
            )}
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

