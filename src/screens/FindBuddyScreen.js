import React, { useState, useCallback, useEffect } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { getPlans, joinPlan } from "../api/planService";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Modal,
  Share,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import LinearGradient from "react-native-linear-gradient";
import { useAuth } from "../context/AuthContext";
import AnimatedBackground from "../components/AnimatedBackground";
import { searchUsers as apiSearchUsers } from "../api/userService";
import { sendBuddyRequest, getPendingRequests, acceptBuddyRequest } from "../api/friendshipService";
import { TextInput } from "react-native-gesture-handler";
import appConfig from "../config/appConfig";




const CATEGORIES = [
  { id: "movie", label: "Movie", icon: "film", activeColor: "#818cf8" },
  { id: "cafe", label: "Café", icon: "coffee", activeColor: "#fb923c" },
  { id: "event", label: "Event", icon: "ticket-alt", activeColor: "#3b82f6" },
  { id: "sport", label: "Sport", icon: "running", activeColor: "#4ade80" },
];

const CATEGORY_COLORS = {
  movie: '#818cf8', cafe: '#fb923c', event: '#3b82f6',
  sport: '#4ade80', default: '#818cf8'
};

const TIME_FILTERS = ["Now", "1 Hour", "Tonight"];

const toArray = (value) => (Array.isArray(value) ? value : []);

const formatPlanTime = (dateTime) => {
  if (!dateTime) return "Time TBD";
  const date = new Date(dateTime);
  if (Number.isNaN(date.getTime())) return "Time TBD";
  try {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "Time TBD";
  }
};

class ScreenErrorBoundary extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("FindBuddyScreen crashed:", error, info);
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      const message =
        typeof this.state.error?.message === "string"
          ? this.state.error.message
          : String(this.state.error);

      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#0a0a15" }}>
          <View style={{ flex: 1, padding: 20, justifyContent: "center" }}>
            <Text style={{ color: "white", fontSize: 20, fontWeight: "700", marginBottom: 12 }}>
              Something went wrong
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.7)", marginBottom: 16 }}>
              {message}
            </Text>
            <TouchableOpacity
              onPress={this.reset}
              style={{
                alignSelf: "flex-start",
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 999,
                backgroundColor: "rgba(168,85,247,0.2)",
                borderWidth: 1,
                borderColor: "rgba(168,85,247,0.35)",
              }}
              activeOpacity={0.8}
            >
              <Text style={{ color: "#c084fc", fontWeight: "700" }}>Retry</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

export default function FindBuddyScreen({ navigation }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("Now");
  const [activeCategory, setActiveCategory] = useState("movie");
  const [allPlans, setAllPlans] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [locationRadius, setLocationRadius] = useState(2);
  const [showRadiusModal, setShowRadiusModal] = useState(false);
  const [mode, setMode] = useState("plans");
  const [searchQuery, setSearchQuery] = useState("");
  const [discoveredUsers, setDiscoveredUsers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [userLocation, setUserLocation] = useState(null);       // { lat, lng }
  const [locationLabel, setLocationLabel] = useState("Your Location"); // reverse-geocoded label

  // Get approximate location via IP (no native package needed)
  useEffect(() => {
    const getIPLocation = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (data.city) {
          const label = data.region ? `${data.city}, ${data.region}` : data.city;
          setLocationLabel(label);
          setUserLocation({ lat: data.latitude, lng: data.longitude });
        } else {
          setLocationLabel('Your Location');
        }
      } catch {
        setLocationLabel('Your Location');
        setUserLocation({ lat: 0, lng: 0 }); // mark as resolved
      }
    };
    getIPLocation();
  }, []);


  // Simple fetch function
  const loadPlans = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getPlans(activeCategory);
      
      let plans = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      
      plans = plans.filter(p => {
        if (!p || !p._id) return false;
        const participants = toArray(p.participants);
        const isParticipant = participants.some(
          (part) => part === user?._id || part?._id === user?._id
        );
        const isCreator = p.createdBy === user?._id || p.createdBy?._id === user?._id;
        return !isParticipant && !isCreator;
      });
      
      setAllPlans(plans);
      setCurrentIndex(0);
      console.log("Plans loaded:", plans.length);
    } catch (error) {
      console.error("Error loading plans:", error);
      setAllPlans([]);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, user?._id]);

  const loadPendingRequests = useCallback(async () => {
    try {
      const res = await getPendingRequests();
      setPendingRequests(res.data.data || []);
    } catch (err) {
      console.error("Error loading pending requests:", err);
    }
  }, []);

  const handleSearchUsers = async (query) => {
    if (!query) {
      setDiscoveredUsers([]);
      return;
    }
    try {
      setIsSearching(true);
      const res = await apiSearchUsers(query);
      // Filter out self and people who are already buddies if needed (will do on backend usually)
      setDiscoveredUsers(res.data.data || []);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddBuddy = async (targetUserId) => {
    try {
      await sendBuddyRequest(targetUserId);
      Alert.alert("Request Sent!", "They need to accept your buddy request.");
      // Refresh social state if needed
    } catch (error) {
      Alert.alert("Failed", error.response?.data?.message || "Could not send request");
    }
  };

  const handleAcceptBuddy = async (requestId) => {
    try {
      await acceptBuddyRequest(requestId);
      Alert.alert("Success!", "You are now buddies!");
      loadPendingRequests(); // Refresh
    } catch (error) {
      Alert.alert("Error", "Failed to accept request");
    }
  };

  // Load plans when component mounts or category changes
  useEffect(() => {
    if (mode === "plans") {
      loadPlans();
    } else {
      loadPendingRequests();
    }
  }, [loadPlans, loadPendingRequests, mode]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (mode === "buddies") handleSearchUsers(searchQuery);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, mode]);

  // UseFocusEffect to refresh when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (mode === "buddies") loadPendingRequests();
    }, [mode, loadPendingRequests])
  );


  // Time filter logic
  const isTimeMatch = (dateTime) => {
    if (!dateTime) return true;
    const planTime = new Date(dateTime);
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const tonight = new Date(now);
    tonight.setHours(23, 59, 59, 999);

    if (activeTab === "Now") return planTime <= oneHourLater;
    if (activeTab === "1 Hour") return planTime > oneHourLater && planTime <= twoHoursLater;
    if (activeTab === "Tonight") return planTime.toDateString() === now.toDateString() && planTime <= tonight;
    return true;
  };

  const filteredPlans = allPlans.filter(p => {
    try {
      return isTimeMatch(p.dateTime);
    } catch (e) {
      console.error("Error filtering plan:", e);
      return false;
    }
  });
  const currentPlan = filteredPlans[currentIndex] || null;
  const currentParticipants = toArray(currentPlan?.participants);
  
  console.log("Filtered plans:", filteredPlans.length, "Current index:", currentIndex, "Current plan:", currentPlan?._id);

  const handleSkip = () => {
    if (currentIndex < filteredPlans.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handleJoin = async () => {
    if (!currentPlan?._id) return;
    try {
      setLoading(true);
      await joinPlan(currentPlan._id);
      Alert.alert("Success!", "You joined the plan", [
        { text: "View", onPress: () => navigation.navigate("PlanDetail", { planId: currentPlan._id }) },
        { text: "Skip", onPress: handleSkip },
      ]);
      handleSkip();
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Failed to join");
    } finally {
      setLoading(false);
    }
  };

  const handleSharePlan = async () => {
    if (!currentPlan) return;
    try {
      await Share.share({
        message: `Join me for "${currentPlan.title}" on EventBuddy! 🚀\n\n📅 When: ${formatPlanTime(currentPlan.dateTime)}\n📍 Where: ${currentPlan.location?.address || "TBD"}\n\nDownload EventBuddy to join the vibe!`,
      });
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  return (
    <ScreenErrorBoundary>
      <AnimatedBackground>
        <SafeAreaView className="flex-1" style={{ backgroundColor: "#0a0a15" }}>
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 220 }}
            scrollEnabled={true}
          >
            {/* Header */}
            <View style={{ paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 32, marginBottom: 20 }}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981' }} />
                  <Text style={{ color: '#6b7280', fontSize: 9, fontWeight: '700', letterSpacing: 3, textTransform: 'uppercase' }}>
                    {mode === 'plans' ? 'Discover' : 'Connect'}
                  </Text>
                </View>
                <Text style={{ color: 'white', fontSize: 28, fontWeight: '800', letterSpacing: -0.5 }}>
                  {mode === 'plans' ? 'Find Your Vibe' : 'Build Circle'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('Notifications')}
                style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#1f2937', borderWidth: 1, borderColor: '#374151', position: 'relative' }}
                activeOpacity={0.7}
              >
                <Ionicons name="notifications-outline" size={20} color="#d1d5db" />
                {pendingRequests.length > 0 && (
                  <View style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: '#4f46e5', borderWidth: 1.5, borderColor: '#0a0a15' }} />
                )}
              </TouchableOpacity>
            </View>

            {/* Mode Switcher */}
            <View style={{ paddingHorizontal: 24, marginBottom: 24, flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setMode('plans')}
                style={{ flex: 1, paddingVertical: 14, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: mode === 'plans' ? '#4f46e522' : '#1f2937', borderWidth: 1, borderColor: mode === 'plans' ? '#4f46e5' : '#374151' }}
                activeOpacity={0.8}
              >
                <Ionicons name="calendar" size={17} color={mode === 'plans' ? '#818cf8' : '#6b7280'} />
                <Text style={{ color: mode === 'plans' ? 'white' : '#9ca3af', fontWeight: '700', marginLeft: 8, fontSize: 14 }}>Discovery</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setMode('buddies')}
                style={{ flex: 1, paddingVertical: 14, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: mode === 'buddies' ? '#4f46e522' : '#1f2937', borderWidth: 1, borderColor: mode === 'buddies' ? '#4f46e5' : '#374151' }}
                activeOpacity={0.8}
              >
                <Ionicons name="people" size={17} color={mode === 'buddies' ? '#818cf8' : '#6b7280'} />
                <Text style={{ color: mode === 'buddies' ? 'white' : '#9ca3af', fontWeight: '700', marginLeft: 8, fontSize: 14 }}>Buddies</Text>
              </TouchableOpacity>
            </View>

            {mode === "plans" ? (
              <>


            {/* Category Chips */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={{ marginBottom: 20 }}
              contentContainerStyle={{ paddingHorizontal: 24, gap: 10 }}
              scrollEventThrottle={16}
            >
              {CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setActiveCategory(cat.id)}
                    disabled={loading}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 50, borderWidth: 1.5, opacity: loading ? 0.5 : 1, backgroundColor: isActive ? cat.activeColor + '22' : '#1f2937', borderColor: isActive ? cat.activeColor : '#374151', minWidth: 90, justifyContent: 'center' }}
                    activeOpacity={0.75}
                  >
                    <FontAwesome5 name={cat.icon} size={13} color={isActive ? cat.activeColor : '#6b7280'} style={{ marginRight: 7 }} />
                    <Text style={{ color: isActive ? 'white' : '#9ca3af', fontWeight: '700', fontSize: 13 }}>{cat.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Time Filter Tabs */}
            <View style={{ paddingHorizontal: 24, marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', backgroundColor: '#111827', borderRadius: 16, padding: 4, borderWidth: 1, borderColor: '#1f2937' }}>
                {TIME_FILTERS.map((tab) => {
                  const isActive = activeTab === tab;
                  return (
                    <TouchableOpacity
                      key={tab}
                      onPress={() => { if (activeTab !== tab) { setActiveTab(tab); setCurrentIndex(0); } }}
                      style={{ flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: isActive ? '#1f2937' : 'transparent', borderWidth: isActive ? 1 : 0, borderColor: '#4f46e555' }}
                      activeOpacity={0.7}
                    >
                      <Text style={{ color: isActive ? 'white' : '#6b7280', fontWeight: '700', fontSize: 13 }}>{tab}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Location Card */}
            <Animated.View entering={FadeInDown.delay(200)} style={{ paddingHorizontal: 24, marginBottom: 20 }}>
              <TouchableOpacity
                onPress={() => setShowRadiusModal(true)}
                activeOpacity={0.8}
                style={{ backgroundColor: '#111827', borderRadius: 24, paddingVertical: 20, paddingHorizontal: 20, alignItems: 'center', flexDirection: 'row', borderWidth: 1, borderColor: '#1f2937', gap: 14 }}
              >
                <View style={{ width: 44, height: 44, backgroundColor: '#1d4ed822', borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#3b82f633' }}>
                  <Ionicons name="location" size={22} color={userLocation ? '#60a5fa' : '#6b7280'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>{locationLabel}</Text>
                  <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>{locationRadius}km radius · Tap to change</Text>
                </View>
                {userLocation ? (
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981' }} />
                ) : (
                  <ActivityIndicator size="small" color="#6b7280" />
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Content Section */}
            {loading ? (
              <View style={{ paddingHorizontal: 24, marginBottom: 80, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
                <ActivityIndicator size="large" color="#818cf8" />
                <Text style={{ color: '#6b7280', marginTop: 16, fontWeight: '600', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' }}>Finding plans...</Text>
              </View>
            ) : !currentPlan ? (
              <View style={{ paddingHorizontal: 24, marginBottom: 80, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
                <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#1f2937', borderWidth: 1, borderColor: '#374151', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Ionicons name="search-outline" size={34} color="#4b5563" />
                </View>
                <Text style={{ color: 'white', fontWeight: '700', fontSize: 18, marginBottom: 8 }}>No plans found</Text>
                <Text style={{ color: '#6b7280', fontSize: 13, textAlign: 'center', marginBottom: 20 }}>Try adjusting filters or check back later</Text>
                <TouchableOpacity
                  onPress={() => { setActiveTab('Now'); setActiveCategory('movie'); }}
                  style={{ paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#4f46e522', borderRadius: 50, borderWidth: 1, borderColor: '#4f46e555' }}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: '#818cf8', fontWeight: '700' }}>Reset Filters</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Animated.View entering={FadeInUp.delay(300)} style={{ paddingHorizontal: 20, marginBottom: 80 }}>
                {/* Section label */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingHorizontal: 4 }}>
                  <Text style={{ color: 'white', fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' }}>Plan {currentIndex + 1} of {filteredPlans.length}</Text>
                  <Text style={{ color: CATEGORY_COLORS[currentPlan?.category?.toLowerCase()] || '#818cf8', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>{currentPlan?.category || 'Event'}</Text>
                </View>

                {/* Main Plan Card */}
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate('PlanDetail', { planId: currentPlan._id })}
                  style={{ backgroundColor: '#111827', borderRadius: 28, borderWidth: 1, borderColor: '#1f2937', overflow: 'hidden' }}
                >
                  {/* Category Accent Bar */}
                  <View style={{ height: 4, backgroundColor: CATEGORY_COLORS[currentPlan?.category?.toLowerCase()] || '#818cf8', opacity: 0.8 }} />

                  <View style={{ padding: 24 }}>
                    {/* Card Header row */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={{ paddingHorizontal: 12, paddingVertical: 5, backgroundColor: (CATEGORY_COLORS[currentPlan?.category?.toLowerCase()] || '#818cf8') + '22', borderRadius: 10, borderWidth: 1, borderColor: (CATEGORY_COLORS[currentPlan?.category?.toLowerCase()] || '#818cf8') + '44' }}>
                          <Text style={{ fontSize: 10, color: CATEGORY_COLORS[currentPlan?.category?.toLowerCase()] || '#818cf8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>{currentPlan?.category || 'Event'}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                          <Ionicons name="time-outline" size={13} color="#6b7280" />
                          <Text style={{ color: '#9ca3af', fontSize: 12 }}>{formatPlanTime(currentPlan?.dateTime)}</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => Alert.alert('Plan Options', 'What would you like to do?', [
                          { text: 'View Details', onPress: () => navigation.navigate('PlanDetail', { planId: currentPlan._id }) },
                          { text: 'Share', onPress: handleSharePlan },
                          { text: 'Cancel', style: 'cancel' },
                        ])}
                        style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#1f2937' }}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="ellipsis-horizontal" size={18} color="#9ca3af" />
                      </TouchableOpacity>
                    </View>

                    {/* Title */}
                    <Text style={{ color: 'white', fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginBottom: 8 }}>
                      {currentPlan?.title || 'Untitled Plan'}
                    </Text>

                    {/* Location */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                      <Ionicons name="location-outline" size={14} color="#6b7280" />
                      <Text style={{ color: '#9ca3af', fontSize: 13 }}>{currentPlan?.location?.address || 'Location TBD'}</Text>
                    </View>

                    {/* Description */}
                    <Text style={{ color: '#d1d5db', fontSize: 14, lineHeight: 22, marginBottom: 20 }} numberOfLines={3}>
                      {currentPlan?.description || 'Looking for buddies to join this plan!'}
                    </Text>

                    {/* Divider */}
                    <View style={{ height: 1, backgroundColor: '#1f2937', marginBottom: 18 }} />

                    {/* Footer: Avatars + Actions */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      {/* Overlapping avatars */}
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {currentParticipants.slice(0, 3).map((p, idx) => (
                          <Image
                            key={idx}
                            source={{ uri: p?.avatar || appConfig.defaultAvatar }}
                            style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: '#111827', marginLeft: idx > 0 ? -12 : 0, zIndex: 3 - idx }}
                          />
                        ))}
                        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#1f2937', borderWidth: 2, borderColor: '#111827', alignItems: 'center', justifyContent: 'center', marginLeft: currentParticipants.length > 0 ? -12 : 0 }}>
                          <Text style={{ color: 'white', fontSize: 10, fontWeight: '800' }}>+{Math.max(1, currentParticipants.length)}</Text>
                        </View>
                      </View>

                      {/* Skip & Join Buttons */}
                      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                        <TouchableOpacity
                          onPress={handleSkip}
                          style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#1f2937', borderWidth: 1, borderColor: '#374151', alignItems: 'center', justifyContent: 'center' }}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="close" size={20} color="#facc15" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={handleJoin}
                          disabled={loading}
                          style={{ width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
                          activeOpacity={0.8}
                        >
                          <LinearGradient
                            colors={['#4f46e5', '#818cf8']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
                          >
                            {loading ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="checkmark" size={22} color="white" />}
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Progress bar */}
                    {filteredPlans.length > 1 && (
                      <View style={{ marginTop: 20, height: 3, backgroundColor: '#1f2937', borderRadius: 2, overflow: 'hidden' }}>
                        <LinearGradient
                          colors={['#4f46e5', '#818cf8']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={{ height: '100%', borderRadius: 2, width: `${((currentIndex + 1) / filteredPlans.length) * 100}%` }}
                        />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </Animated.View>
            )}
            </>
            ) : (
                /* Discover Buddies Mode */
                <View className="px-6">
                    {/* Search Bar */}
                    <View className="relative mb-8">
                        <View className="absolute left-4 top-[14px] z-10">
                            <Ionicons name="search" size={20} color="#6b7280" />
                        </View>
                        <TextInput
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Find someone by name or interest..."
                            placeholderTextColor="#4b5563"
                            className="bg-[#1a1a2e] border border-white/10 rounded-2xl py-3.5 pl-12 pr-12 text-white"
                        />
                        {isSearching && (
                            <View className="absolute right-4 top-[14px]">
                                <ActivityIndicator size="small" color="#a855f7" />
                            </View>
                        )}
                    </View>

                    {/* Pending Requests Inbox */}
                    {pendingRequests.length > 0 && (
                        <Animated.View entering={FadeInDown} style={{ marginBottom: 28 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                              <Text style={{ color: 'white', fontWeight: '800', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' }}>Incoming Requests</Text>
                              <View style={{ backgroundColor: '#ec489922', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#ec489944' }}>
                                <Text style={{ color: '#ec4899', fontWeight: '700', fontSize: 11 }}>{pendingRequests.length}</Text>
                              </View>
                            </View>
                            <ScrollView 
                                horizontal 
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ gap: 12 }}
                            >
                                {pendingRequests.map((req) => (
                                    <View 
                                        key={req._id} 
                                        style={{ backgroundColor: '#111827', borderRadius: 24, padding: 18, width: 200, alignItems: 'center', borderWidth: 1, borderColor: '#1f2937' }}
                                    >
                                        <Image 
                                            source={{ uri: req.requester?.avatar || appConfig.defaultAvatar }} 
                                            style={{ width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: '#4f46e5', marginBottom: 10 }}
                                        />
                                        <Text style={{ color: 'white', fontWeight: '700', fontSize: 14, marginBottom: 4 }} numberOfLines={1}>
                                            {req.requester?.name || req.requester?.firstName || 'Unknown'}
                                        </Text>
                                        <Text style={{ color: '#6b7280', fontSize: 11, marginBottom: 14 }}>Wants to buddy up</Text>
                                        <View style={{ flexDirection: 'row', gap: 8, width: '100%' }}>
                                            <TouchableOpacity 
                                                onPress={() => handleAcceptBuddy(req._id)}
                                                style={{ flex: 1, backgroundColor: '#4f46e5', paddingVertical: 10, borderRadius: 12, alignItems: 'center' }}
                                                activeOpacity={0.8}
                                            >
                                                <Text style={{ color: 'white', fontWeight: '700', fontSize: 12 }}>Accept</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity className="w-12 bg-white/5 border border-white/10 rounded-xl items-center justify-center">
                                                <Ionicons name="close" size={20} color="#ef4444" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}
                            </ScrollView>
                        </Animated.View>
                    )}

                    {/* Search Results */}
                    <Text className="text-sm font-bold text-gray-500 mb-6 uppercase tracking-widest ml-1">
                        {searchQuery ? "People who match your search" : "Trending Buddies ✨"}
                    </Text>

                    <View className="gap-4">
                        {(searchQuery ? discoveredUsers : discoveredUsers.slice(0, 5)).map((person, index) => {
                            if (person._id === user?._id) return null;
                            return (
                                <Animated.View key={person._id} entering={FadeInDown.delay(index * 100)}>
                                    <TouchableOpacity 
                                        className="bg-[#1a1a2e] border border-white/10 rounded-[30px] p-5 flex-row items-center justify-between"
                                    >
                                        <View className="flex-row items-center gap-4 flex-1">
                                            <Image 
                                                source={{ uri: person.avatar || appConfig.defaultAvatar }} 
                                                className="w-14 h-14 rounded-full border border-white/10"
                                            />
                                            <View className="flex-1">
                                                <Text className="text-lg font-bold text-white mb-0.5" numberOfLines={1}>
                                                    {person.name || person.firstName || person.lastName}
                                                </Text>
                                                <View className="flex-row items-center gap-2">
                                                   <View className={`w-2 h-2 rounded-full ${person.isOnline ? 'bg-green-500' : 'bg-gray-600'}`} />
                                                   <Text className="text-gray-500 text-xs">
                                                        {person.isOnline ? 'Online' : 'Offline'}
                                                   </Text>
                                                </View>
                                            </View>
                                        </View>
                                        <TouchableOpacity 
                                            onPress={() => handleAddBuddy(person._id)}
                                            className="bg-blue-600/20 border border-blue-500/50 rounded-full px-5 py-2"
                                        >
                                            <Text className="text-blue-400 font-bold text-xs">+ Add Buddy</Text>
                                        </TouchableOpacity>
                                    </TouchableOpacity>
                                </Animated.View>
                            );
                        })}
                        {discoveredUsers.length === 0 && !isSearching && (
                             <View className="items-center justify-center py-10">
                                <Ionicons name="people-outline" size={48} color="#1f2937" />
                                <Text className="text-gray-600 mt-4 text-center">
                                    {searchQuery ? "No results found" : "Discover new people on EventBuddy!"}
                                </Text>
                             </View>
                        )}
                    </View>
                </View>
            )}

          </ScrollView>
        </SafeAreaView>

        {/* Main Find Buddy / Create Plan CTA */}
        <View style={{ position: 'absolute', bottom: 105, left: 20, right: 20 }}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              if (mode === 'plans' && currentPlan) {
                navigation.navigate('PlanDetail', { planId: currentPlan._id });
              } else if (mode === 'buddies') {
                navigation.navigate('FindBuddy');
              } else {
                navigation.navigate('CreatePlan');
              }
            }}
            style={{ borderRadius: 22, overflow: 'hidden' }}
          >
            <LinearGradient
              colors={['#4f46e5', '#818cf8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ paddingVertical: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}
            >
              <Ionicons name={currentPlan ? 'people' : 'add-circle'} size={22} color="white" />
              <Text style={{ color: 'white', fontSize: 17, fontWeight: '800', letterSpacing: 0.5 }}>
                {mode === 'plans' && currentPlan ? 'View Plan Details' : mode === 'buddies' ? 'Find Buddies' : 'Create a Plan'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </AnimatedBackground>

      {/* Radius Selection Modal */}
      <Modal
        visible={showRadiusModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRadiusModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={() => setShowRadiusModal(false)} 
            style={{ position: 'absolute', inset: 0 }} 
          />
          <Animated.View 
            entering={FadeInDown}
            style={{ backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937', borderRadius: 28, padding: 28, width: '100%', alignItems: 'center' }}
          >
            <View style={{ width: 56, height: 56, backgroundColor: '#1d4ed822', borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#3b82f633' }}>
              <Ionicons name="location" size={26} color="#60a5fa" />
            </View>
            <Text style={{ color: 'white', fontSize: 20, fontWeight: '800', marginBottom: 6, textAlign: 'center' }}>Search Radius</Text>
            <Text style={{ color: '#6b7280', fontSize: 13, textAlign: 'center', marginBottom: 24, paddingHorizontal: 16 }}>
              Find amazing plans within your preferred distance.
            </Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, width: '100%', marginBottom: 20 }}>
              {[1, 2, 5, 10, 20].map((radius) => (
                <TouchableOpacity
                  key={radius}
                  onPress={() => { setLocationRadius(radius); setShowRadiusModal(false); }}
                  style={{ width: '48%', paddingVertical: 16, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', backgroundColor: locationRadius === radius ? '#4f46e522' : '#1f2937', borderColor: locationRadius === radius ? '#4f46e5' : '#374151' }}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: locationRadius === radius ? '#818cf8' : '#9ca3af', fontWeight: '700', fontSize: 16 }}>{radius} km</Text>
                  <Text style={{ color: locationRadius === radius ? '#818cf8' + '99' : '#6b7280', fontSize: 11, marginTop: 2 }}>
                    {radius === 1 ? 'Walking' : radius <= 2 ? 'Nearby' : radius <= 5 ? 'Local' : radius <= 10 ? 'City-wide' : 'Regional'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => setShowRadiusModal(false)}
              style={{ width: '100%', paddingVertical: 14, backgroundColor: '#1f2937', borderRadius: 16, alignItems: 'center' }}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#9ca3af', fontWeight: '700' }}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </ScreenErrorBoundary>
  );
}
