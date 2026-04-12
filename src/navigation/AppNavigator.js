import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "react-native-vector-icons/Ionicons";
import { View, ActivityIndicator, Platform } from "react-native";

import { useAuth } from "../context/AuthContext";

// Screens
import SplashScreen from "../screens/SplashScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import OtpVerifyScreen from "../screens/OtpVerifyScreen";
import HomeScreen from "../screens/HomeScreen";
import CreatePlanScreen from "../screens/CreatePlanScreen";
import ProfileScreen from "../screens/ProfileScreen";
import PlanDetailScreen from "../screens/PlanDetailScreen";
import ProfileSetupScreen from "../screens/ProfileSetupScreen";
import FindBuddyScreen from "../screens/FindBuddyScreen";
import GroupChatScreen from "../screens/GroupChatScreen";
import ChatListScreen from "../screens/ChatListScreen";
import CredibilityScreen from "../screens/CredibilityScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import MapScreen from "../screens/MapScreen";
import SettingsScreen from "../screens/SettingsScreen";
import DirectChatScreen from "../screens/DirectChatScreen";
import NewMessageScreen from "../screens/NewMessageScreen";
import AddStoryScreen from "../screens/AddStoryScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          bottom: 30,
          left: 24,
          right: 24,
          height: 75,
          backgroundColor: "rgba(10, 10, 15, 0.7)",
          borderRadius: 30,
          borderWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.08)",
          paddingBottom: 15,
          paddingTop: 10,
          elevation: 25,
          ...(Platform.OS === 'ios' && {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.5,
            shadowRadius: 20,
          }),
        },
        tabBarActiveTintColor: "#E5E7EB", // Silver
        tabBarInactiveTintColor: "#6B7280", // Muted Gray
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          marginTop: -5,
        },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName;
          if (route.name === "Explore") iconName = focused ? "compass" : "compass-outline";
          else if (route.name === "Chats") iconName = focused ? "chatbubbles" : "chatbubbles-outline";
          else if (route.name === "Buddies") iconName = focused ? "people" : "people-outline";
          else if (route.name === "Profile") iconName = focused ? "person" : "person-outline";

          if (route.name === "Post") {
            return (
              <View
                className="w-16 h-16 bg-indigo-600/20 rounded-full items-center justify-center -mt-10 border-[0.5px] border-white/20"
                style={[
                  { elevation: 12 },
                  Platform.OS === 'ios' && { 
                    shadowColor: '#6366F1', 
                    shadowOffset: { width: 0, height: 5 }, 
                    shadowOpacity: 0.4, 
                    shadowRadius: 15 
                  },
                ]}
              >
                <View className="w-13 h-13 bg-white rounded-full items-center justify-center shadow-lg">
                  <Ionicons name="add" size={30} color="#0a0a1a" />
                </View>
              </View>
            );
          }

          return (
            <View className="items-center">
              <Ionicons name={iconName} size={24} color={color} />
              {route.name === "Chats" && (
                <View className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-indigo-500 rounded-full" />
              )}
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Explore" component={HomeScreen} />
      <Tab.Screen name="Chats" component={ChatListScreen} />
      <Tab.Screen
        name="Post"
        component={CreatePlanScreen}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate("CreatePlan");
          },
        })}
      />
      <Tab.Screen name="Buddies" component={FindBuddyScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isLoading, token, user } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0a0a15", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#a855f7" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!token ? (
        // Auth/Unauthenticated Stack
        <Stack.Group screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="OtpVerify" component={OtpVerifyScreen} />
        </Stack.Group>
      ) : !user?.isProfileComplete ? (
        // Profile Completion Stack
        <Stack.Group screenOptions={{ headerShown: false }}>
          <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        </Stack.Group>
      ) : (
        // Main App Stack
        <Stack.Group screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="PlanDetail" component={PlanDetailScreen} />
          <Stack.Screen name="GroupChat" component={GroupChatScreen} />
          <Stack.Screen name="DirectChat" component={DirectChatScreen} />
          <Stack.Screen name="CreatePlan" component={CreatePlanScreen} />
          <Stack.Screen name="NewMessage" component={NewMessageScreen} />
          <Stack.Screen name="AddStory" component={AddStoryScreen} />
          <Stack.Screen name="Credibility" component={CredibilityScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />

          <Stack.Screen name="Map" component={MapScreen} options={{ headerShown: false }} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
}
