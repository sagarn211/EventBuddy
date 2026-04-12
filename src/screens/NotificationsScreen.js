import React, { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { getNotifications } from "../api/notificationService";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  Platform,
  ActivityIndicator
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import AnimatedBackground from "../components/AnimatedBackground";

const FILTERS = ["All (5)", "Events", "Social", "System"];

// ─── Reusable notification row ────────────────────────────────────────────────
function NotifRow({ children, unread, opacity = 1 }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={{
        backgroundColor: "rgba(28,28,36,0.85)",
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: unread
          ? "rgba(168,85,247,0.2)"
          : "rgba(255,255,255,0.05)",
        opacity,
        marginBottom: 10,
      }}
    >
      {children}
    </TouchableOpacity>
  );
}

function Row({ children }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 14 }}>
      {children}
    </View>
  );
}

function TimeStamp({ time }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 }}>
      <Ionicons name="time-outline" size={11} color="#6b7280" />
      <Text style={{ color: "#6b7280", fontSize: 11 }}>{time}</Text>
    </View>
  );
}

function UnreadDot({ color = "#a855f7" }) {
  return (
    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, marginTop: 4 }} />
  );
}

function AvatarBadge({ src, emoji, badgeColor, badgeIcon }) {
  return (
    <View style={{ position: "relative", width: 48, height: 48 }}>
      {src ? (
        <Image source={{ uri: src }} style={{ width: 48, height: 48, borderRadius: 24 }} />
      ) : (
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: "rgba(168,85,247,0.2)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {emoji ? (
            <Text style={{ fontSize: 22 }}>{emoji}</Text>
          ) : null}
        </View>
      )}
      {badgeIcon && (
        <View
          style={{
            position: "absolute",
            bottom: -2,
            right: -2,
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: badgeColor || "#a855f7",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 2,
            borderColor: "#111114",
          }}
        >
          <Ionicons name={badgeIcon} size={10} color="white" />
        </View>
      )}
    </View>
  );
}

function SectionLabel({ label }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12, marginTop: 4 }}>
      <Text style={{ color: "#6b7280", fontSize: 11, fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase" }}>
        {label}
      </Text>
    </View>
  );
}

// ──────────────────────────────────────────────────────────────────────────────

export default function NotificationsScreen({ navigation }) {
  const [activeFilter, setActiveFilter] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    try {
      setLoading(true);
      const response = await getNotifications();
      setNotifications(response.data.data || []);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifs();
    }, [])
  );

  return (
    <AnimatedBackground>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingTop: Platform.OS === "android" ? 40 : 12,
            paddingBottom: 12,
          }}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: "rgba(28,28,36,0.9)",
              borderWidth: 1, borderColor: "rgba(255,255,255,0.05)",
              alignItems: "center", justifyContent: "center",
            }}
          >
            <Ionicons name="chevron-back" size={22} color="white" />
          </TouchableOpacity>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={{ color: "white", fontSize: 18, fontWeight: "800" }}>Notifications</Text>
            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: "#a855f7", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: "white", fontSize: 11, fontWeight: "900" }}>5</Text>
            </View>
          </View>

          <TouchableOpacity
            style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: "rgba(28,28,36,0.9)",
              borderWidth: 1, borderColor: "rgba(255,255,255,0.05)",
              alignItems: "center", justifyContent: "center",
            }}
          >
            <Ionicons name="checkmark-done" size={18} color="#22d3ee" />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        >
          {/* Filter Tabs */}
          <Animated.View entering={FadeInDown.delay(100)}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingVertical: 8, paddingBottom: 16 }}
            >
              {FILTERS.map((f, i) => (
                <TouchableOpacity
                  key={f}
                  onPress={() => setActiveFilter(i)}
                  style={{ borderRadius: 30, overflow: "hidden" }}
                >
                  {i === activeFilter ? (
                    <LinearGradient
                      colors={["#b428d4", "#06b6d4"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ paddingHorizontal: 18, paddingVertical: 10 }}
                    >
                      <Text style={{ color: "white", fontSize: 13, fontWeight: "700" }}>{f}</Text>
                    </LinearGradient>
                  ) : (
                    <View
                      style={{
                        paddingHorizontal: 18, paddingVertical: 10,
                        backgroundColor: "rgba(28,28,36,0.9)",
                        borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
                        borderRadius: 30,
                      }}
                    >
                      <Text style={{ color: "#9ca3af", fontSize: 13, fontWeight: "600" }}>{f}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>

          {/* Notifications List */}
          <Animated.View entering={FadeInUp.delay(150)}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text style={{ color: "#6b7280", fontSize: 11, fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase" }}>Recent Notifications</Text>
            </View>

            {loading ? (
               <ActivityIndicator size="small" color="#a855f7" className="mt-10" />
            ) : notifications.length > 0 ? notifications.map((notif, index) => (
              <NotifRow key={notif._id} unread={!notif.read}>
                <Row>
                  <AvatarBadge
                    emoji={notif.message.includes('join') ? '🤝' : '📩'}
                    badgeColor="#a855f7"
                    badgeIcon={notif.message.includes('join') ? 'person-add' : 'chatbubble'}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "white", fontSize: 13, lineHeight: 19 }}>
                      {notif.message}
                    </Text>
                    <TimeStamp time={new Date(notif.createdAt).toLocaleString()} />
                  </View>
                  {!notif.read && <UnreadDot color="#a855f7" />}
                </Row>
              </NotifRow>
            )) : (
              <View className="items-center justify-center mt-20">
                <Ionicons name="notifications-off-outline" size={48} color="#4b5563" />
                <Text className="text-gray-500 mt-4 font-bold text-lg">No notifications yet</Text>
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </AnimatedBackground>
  );
}
