import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Platform,
  Alert,
  Switch,
  Modal
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import LinearGradient from "react-native-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import appConfig from "../config/appConfig";

import Animated, { 
  FadeInDown, 
  FadeInUp, 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  Easing
} from "react-native-reanimated";
import { useAuth } from "../context/AuthContext";
import { getMe, updateProfile } from "../api/userService";
import AnimatedBackground from "../components/AnimatedBackground";

const SETTINGS_OPTIONS = [
  {
    id: "edit",
    title: "Edit Profile",
    subtitle: "Change name, photo & bio",
    icon: "user",
    iconFamily: "FontAwesome5",
    color: "#818cf8",
    bg: "rgba(99, 102, 241, 0.2)",
    shadow: "rgba(99, 102, 241, 0.4)",
  },
  {
    id: "privacy",
    title: "Privacy",
    subtitle: "Control who sees your data",
    icon: "shield-halved",
    iconFamily: "FontAwesome5",
    color: "#3b82f6",
    bg: "rgba(59, 130, 246, 0.2)",
    shadow: "rgba(59, 130, 246, 0.4)",
  },
  {
    id: "notifications",
    title: "Notifications",
    subtitle: "Manage alerts & reminders",
    icon: "bell",
    iconFamily: "FontAwesome5",
    color: "#ec4899",
    bg: "rgba(236, 72, 153, 0.2)",
    shadow: "rgba(236, 72, 153, 0.4)",
    hasBadge: true,
  },
  {
    id: "preferences",
    title: "Preferences",
    subtitle: "Theme, suggestions & data",
    icon: "sliders-h",
    iconFamily: "FontAwesome5",
    color: "#9ca3af",
    bg: "rgba(156, 163, 175, 0.2)",
    shadow: "rgba(156, 163, 175, 0.2)",
  },
];

export default function SettingsScreen({ navigation }) {
  const { logout, user, updateUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState({ title: "", message: "" });
  
  // Settings state
  const [notificationSettings, setNotificationSettings] = useState({
    eventNotifications: true,
    messageNotifications: true,
    reminderNotifications: true,
    promotionalEmails: false,
  });

  const [privacySettings, setPrivacySettings] = useState({
    profilePublic: true,
    allowMessages: true,
    showOnlineStatus: true,
    shareLocation: false,
  });

  const [preferencesSettings, setPreferencesSettings] = useState({
    darkMode: true,
    allowSuggestions: true,
    dataCollection: false,
    downloadData: false,
    isOrganiser: user?.role === 'organiser',
  });
  
  // Floating animation for profile card
  const translateY = useSharedValue(0);

  useEffect(() => {
    fetchUserData();
    translateY.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await getMe();
      setUserData(response.data.data);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const animatedProfileStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleLogout = () => {
    console.log("🚪 Logout pressed");
    Alert.alert("Logout", "Are you sure you want to exit?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logout },
    ]);
  };

  const handleSettingPress = (id) => {
    console.log("🎯 handleSettingPress called with id:", id);
    switch (id) {
      case "edit":
        console.log("Navigating to ProfileSetup");
        try {
          navigation.navigate("ProfileSetup", { user: userData || user });
        } catch (error) {
          console.error("Navigation error:", error);
          Alert.alert("Navigation Error", "Could not navigate to profile setup");
        }
        break;
      case "privacy":
        console.log("Showing privacy settings");
        showPrivacySettings();
        break;
      case "notifications":
        console.log("Showing notification settings");
        showNotificationSettings();
        break;
      case "preferences":
        console.log("Showing preferences settings");
        showPreferencesSettings();
        break;
      default:
        console.log("Unknown setting id");
        break;
    }
  };

  const showPrivacySettings = () => setActiveModal('privacy');
  const showNotificationSettings = () => setActiveModal('notifications');
  const showPreferencesSettings = () => setActiveModal('preferences');

  const toggleOrganiserMode = async (val) => {
    try {
      setPreferencesSettings(prev => ({...prev, isOrganiser: val}));
      const newRole = val ? 'organiser' : 'user';
      const response = await updateProfile({ role: newRole });
      if (response.data.success) {
        const { updateUser } = useAuth.getState ? { updateUser: () => {} } : {}; // Placeholder if not used via hook
        // Since we are inside the component, we can use the hook's updateUser
      }
    } catch (err) {
      console.error("Error toggling organiser mode:", err);
      Alert.alert("Error", "Failed to update professional status.");
    }
  };

  const renderSettingSwitch = (label, value, onToggle) => (
    <View key={label} className="flex-row items-center justify-between w-full py-3 border-b border-white/5">
      <Text className="text-gray-200 text-base">{label}</Text>
      <Switch
        trackColor={{ false: "#374151", true: "#818cf8" }}
        thumbColor={value ? "#ffffff" : "#9ca3af"}
        ios_backgroundColor="#3e3e3e"
        onValueChange={onToggle}
        value={value}
      />
    </View>
  );


  const handleQRPress = () => {
    console.log("📷 QR button pressed, opening modal");
    setShowQRModal(true);
  };

  return (
    <AnimatedBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, paddingHorizontal: 20 }}>

          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Platform.OS === 'android' ? 48 : 24, marginBottom: 28 }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#1f2937', borderWidth: 1, borderColor: '#374151', alignItems: 'center', justifyContent: 'center' }}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={22} color="#d1d5db" />
            </TouchableOpacity>

            <View style={{ alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981' }} />
                <Text style={{ color: '#6b7280', fontSize: 9, fontWeight: '700', letterSpacing: 3, textTransform: 'uppercase' }}>Account</Text>
              </View>
              <Text style={{ color: 'white', fontSize: 22, fontWeight: '800', letterSpacing: -0.5 }}>Settings</Text>
            </View>

            <TouchableOpacity
              onPress={handleQRPress}
              style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#1f2937', borderWidth: 1, borderColor: '#374151', alignItems: 'center', justifyContent: 'center' }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="qrcode-scan" size={18} color="#818cf8" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
            scrollEnabled={true}
            nestedScrollEnabled={true}
          >
            {/* Profile Card */}
            <Animated.View entering={FadeInDown.delay(100)} style={[animatedProfileStyle, { marginBottom: 28 }]}>
              <View style={{ backgroundColor: '#111827', borderRadius: 28, padding: 20, borderWidth: 1, borderColor: '#1f2937', flexDirection: 'row', alignItems: 'center' }}>
                {/* Indigo gradient ring avatar */}
                <View style={{ position: 'relative', marginRight: 16 }}>
                  <LinearGradient
                    colors={['#4f46e5', '#818cf8']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={{ width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', padding: 2.5 }}
                  >
                    <View style={{ width: '100%', height: '100%', borderRadius: 36, overflow: 'hidden', backgroundColor: '#0a0a15' }}>
                      <Image
                        source={{ uri: userData?.avatar || appConfig.defaultAvatar }}
                        style={{ width: '100%', height: '100%', borderRadius: 36 }}
                      />
                    </View>
                  </LinearGradient>
                  {/* Online dot */}
                  <View style={{ position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#10b981', borderWidth: 2, borderColor: '#111827' }} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ color: 'white', fontSize: 18, fontWeight: '800', marginBottom: 2 }}>{userData?.name || user?.name || 'User'}</Text>
                  <Text style={{ color: '#818cf8', fontSize: 13, fontWeight: '600' }}>@{(userData?.name || user?.name || 'user').toLowerCase().replace(' ', '.')}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981' }} />
                    <Text style={{ color: '#6b7280', fontSize: 11, fontWeight: '600' }}>Active now</Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => navigation.navigate('ProfileSetup', { user: userData || user })}
                  style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#4f46e5' + '22', borderWidth: 1, borderColor: '#4f46e5' + '55', alignItems: 'center', justifyContent: 'center' }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="pencil" size={16} color="#818cf8" />
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Section Label */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingHorizontal: 4 }}>
              <Text style={{ color: 'white', fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' }}>Preferences</Text>
              <Text style={{ color: '#6b7280', fontSize: 11 }}>{SETTINGS_OPTIONS.length} options</Text>
            </View>

            {/* Settings List */}
            <View style={{ gap: 10 }}>
              {SETTINGS_OPTIONS.map((item, index) => (
                <Animated.View
                  key={item.id}
                  entering={FadeInDown.delay(200 + index * 80).duration(500)}
                >
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => { handleSettingPress(item.id); }}
                  >
                    <View style={{ backgroundColor: '#111827', borderRadius: 20, borderWidth: 1, borderColor: '#1f2937', flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                      {/* Left accent bar */}
                      <View style={{ width: 3, height: 44, borderRadius: 2, backgroundColor: item.color, marginRight: 14, opacity: 0.9 }} />

                      {/* Icon */}
                      <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: item.bg, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                        <FontAwesome5 name={item.icon} size={18} color={item.color} />
                      </View>

                      {/* Text */}
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: 'white', fontSize: 15, fontWeight: '700', marginBottom: 2 }}>{item.title}</Text>
                        <Text style={{ color: '#6b7280', fontSize: 12 }}>{item.subtitle || 'Tap to configure'}</Text>
                      </View>

                      {/* Badge + chevron */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        {item.hasBadge && (
                          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#ec4899' }} />
                        )}
                        <Ionicons name="chevron-forward" size={16} color="#4b5563" />
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>

            {/* Logout */}
            <Animated.View entering={FadeInUp.delay(700)} style={{ marginTop: 32 }}>
              <TouchableOpacity
                onPress={handleLogout}
                activeOpacity={0.75}
                style={{ backgroundColor: '#1f1520', borderRadius: 20, borderWidth: 1, borderColor: '#7f1d1d' + '55', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 10 }}
              >
                <Ionicons name="log-out-outline" size={20} color="#f43f5e" />
                <Text style={{ color: '#f43f5e', fontWeight: '800', fontSize: 14, letterSpacing: 2, textTransform: 'uppercase' }}>Sign Out</Text>
              </TouchableOpacity>

              <Text style={{ textAlign: 'center', color: '#374151', fontSize: 10, fontWeight: '700', letterSpacing: 3, textTransform: 'uppercase', marginTop: 28 }}>
                EventBuddy v2.4.1
              </Text>
            </Animated.View>

          </ScrollView>

          {/* QR Code Modal */}
          <Modal
            visible={showQRModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowQRModal(false)}
          >
            <View className="flex-1 bg-black/80 items-center justify-center">
              <TouchableOpacity 
                activeOpacity={1}
                onPress={() => setShowQRModal(false)}
                className="absolute inset-0"
              />
              
              <Animated.View 
                entering={FadeInDown}
                style={{ backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937', borderRadius: 30, padding: 28, alignItems: 'center', width: '85%', zIndex: 10 }}
              >
                <Text className="text-xl font-bold text-white mb-6 text-center">Your Profile QR Code</Text>
                
                {/* QR Code Placeholder */}
                <View className="w-48 h-48 bg-white/5 border-2 border-white/20 rounded-2xl items-center justify-center mb-6">
                  <MaterialCommunityIcons name="qrcode" size={120} color="#818cf8" />
                </View>
                
                <Text className="text-gray-400 text-center text-sm mb-6">
                  Share this QR code so others can add you! They can scan it to view your profile.
                </Text>
                
                <Text className="text-white font-semibold text-center mb-6">
                  {userData?.name || user?.name || "User"}
                </Text>
                
                <View className="flex-row gap-3 w-full">
                  <TouchableOpacity 
                    onPress={() => {
                      console.log("Copy button pressed");
                      Alert.alert("Success", "QR Code copied to clipboard!");
                      setShowQRModal(false);
                    }}
                    activeOpacity={0.7}
                    style={{ flex: 1, paddingVertical: 12, backgroundColor: '#4f46e5', borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text className="text-white font-bold">Copy</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    onPress={() => {
                      console.log("Save button pressed");
                      Alert.alert("Success", "QR Code saved! Check your gallery.");
                      setShowQRModal(false);
                    }}
                    activeOpacity={0.7}
                    style={{ flex: 1, paddingVertical: 12, backgroundColor: '#0891b2', borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text className="text-white font-bold">Save</Text>
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity 
                  onPress={() => {
                    console.log("Close button pressed");
                    setShowQRModal(false);
                  }}
                  activeOpacity={0.7}
                  className="mt-4 w-full py-3 bg-white/5 rounded-xl items-center justify-center"
                >
                  <Text className="text-gray-300 font-semibold">Close</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </Modal>

          {/* Settings Modals */}
          <Modal
            visible={!!activeModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setActiveModal(null)}
          >
            <View className="flex-1 bg-black/80 items-center justify-center">
              <TouchableOpacity 
                activeOpacity={1}
                onPress={() => setActiveModal(null)}
                className="absolute inset-0"
              />
              
              <Animated.View 
                entering={FadeInDown}
                style={{ backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937', borderRadius: 30, padding: 24, alignItems: 'center', width: '88%', zIndex: 10 }}
              >
                <Text className="text-xl font-bold text-white mb-6 text-center">
                  {activeModal === 'privacy' && "Privacy Settings"}
                  {activeModal === 'notifications' && "Notifications"}
                  {activeModal === 'preferences' && "Preferences"}
                </Text>

                <View className="w-full mb-6 max-h-[300px]">
                  <ScrollView showsVerticalScrollIndicator={false}>
                    {activeModal === 'privacy' && (
                      <>
                        {renderSettingSwitch("Profile Public", privacySettings.profilePublic, (val) => setPrivacySettings(prev => ({...prev, profilePublic: val})))}
                        {renderSettingSwitch("Allow Messages", privacySettings.allowMessages, (val) => setPrivacySettings(prev => ({...prev, allowMessages: val})))}
                        {renderSettingSwitch("Show Online Status", privacySettings.showOnlineStatus, (val) => setPrivacySettings(prev => ({...prev, showOnlineStatus: val})))}
                        {renderSettingSwitch("Share Location", privacySettings.shareLocation, (val) => setPrivacySettings(prev => ({...prev, shareLocation: val})))}
                      </>
                    )}
                    {activeModal === 'notifications' && (
                      <>
                        {renderSettingSwitch("Event Notifications", notificationSettings.eventNotifications, (val) => setNotificationSettings(prev => ({...prev, eventNotifications: val})))}
                        {renderSettingSwitch("Message Alerts", notificationSettings.messageNotifications, (val) => setNotificationSettings(prev => ({...prev, messageNotifications: val})))}
                        {renderSettingSwitch("Reminders", notificationSettings.reminderNotifications, (val) => setNotificationSettings(prev => ({...prev, reminderNotifications: val})))}
                        {renderSettingSwitch("Promotional Emails", notificationSettings.promotionalEmails, (val) => setNotificationSettings(prev => ({...prev, promotionalEmails: val})))}
                      </>
                    )}
                    {activeModal === 'preferences' && (
                      <>
                        {renderSettingSwitch("Dark Mode", preferencesSettings.darkMode, (val) => setPreferencesSettings(prev => ({...prev, darkMode: val})))}
                        {renderSettingSwitch("Allow Suggestions", preferencesSettings.allowSuggestions, (val) => setPreferencesSettings(prev => ({...prev, allowSuggestions: val})))}
                        {renderSettingSwitch("Data Collection", preferencesSettings.dataCollection, (val) => setPreferencesSettings(prev => ({...prev, dataCollection: val})))}
                        {renderSettingSwitch("Organiser Mode 💼", preferencesSettings.isOrganiser, async (val) => {
                           try {
                              setPreferencesSettings(prev => ({...prev, isOrganiser: val}));
                              const res = await updateProfile({ role: val ? 'organiser' : 'user' });
                              if (res.data.success) {
                                 // Update local context using the extracted updateUser function
                                 await updateUser({ role: val ? 'organiser' : 'user' });
                                 setSuccessData({
                                   title: "Success",
                                   message: val ? "Organiser Mode Activated!" : "Back to Personal Mode"
                                 });
                                 setShowSuccessModal(true);
                               }
                           } catch (e) {
                              console.error("Organiser Toggle Error:", e);
                              setSuccessData({
                                title: "Error",
                                message: "Failed to update status"
                              });
                              setShowSuccessModal(true);
                           }
                        })}
                      </>
                    )}
                  </ScrollView>
                </View>

                {activeModal === 'preferences' && (
                  <TouchableOpacity 
                    onPress={() => {
                        setSuccessData({
                          title: "Success",
                          message: "Data export started. Check your email."
                        });
                        setShowSuccessModal(true);
                    }}
                    className="w-full py-3 bg-white/5 border border-white/10 rounded-xl items-center justify-center mb-4"
                  >
                    <Text className="text-gray-300 font-semibold">Download My Data</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity 
                  onPress={() => {
                    setSuccessData({
                      title: "Saved",
                      message: "Settings updated successfully!"
                    });
                    setShowSuccessModal(true);
                    setActiveModal(null);
                  }}
                  style={{ width: '100%', paddingVertical: 14, backgroundColor: '#4f46e5', borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}
                >
                  <Text className="text-white font-bold text-lg">Save Settings</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => setActiveModal(null)}
                  className="w-full py-3 bg-white/5 rounded-xl items-center justify-center"
                >
                  <Text className="text-gray-400 font-semibold">Cancel</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </Modal>
        </View>
      </SafeAreaView>
      {/* Success Modal */}
      <Modal
        transparent
        visible={showSuccessModal}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <TouchableOpacity 
          activeOpacity={1}
          onPress={() => setShowSuccessModal(false)}
          className="flex-1 bg-black/70 flex items-center justify-center px-6"
        >
          <Animated.View 
            entering={FadeInDown}
            className="bg-[#1a1a24] border border-white/10 rounded-[32px] p-8 w-full max-w-sm overflow-hidden"
          >
            {/* Design Elements */}
            <View className="absolute -top-10 -right-10 w-32 h-32 bg-green-500/10 rounded-full" />
            <View className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-500/10 rounded-full" />

            <View className="items-center">
              <View className="w-16 h-16 rounded-[22px] items-center justify-center mb-6 overflow-hidden relative">
                 <LinearGradient 
                   colors={['#10b981', '#059669']} 
                   className="absolute inset-0"
                   start={{ x: 0, y: 0 }}
                   end={{ x: 1, y: 1 }}
                 />
                 <Ionicons name="checkmark-circle" size={32} color="white" />
              </View>

              <Text className="text-white text-2xl font-bold text-center mb-2 tracking-tight">{successData.title}</Text>
              <Text className="text-gray-400 text-sm text-center mb-8 px-4 leading-5">{successData.message}</Text>

              <TouchableOpacity 
                onPress={() => setShowSuccessModal(false)}
                className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl items-center justify-center active:bg-white/10"
              >
                <Text className="text-white font-bold tracking-widest uppercase text-xs">Dismiss</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </AnimatedBackground>
  );
}
