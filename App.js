import "./global.css";
import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Alert } from "react-native";
import firebase from "@react-native-firebase/app";
import '@react-native-firebase/auth';
import AppNavigator from "./src/navigation/AppNavigator";
import { AuthProvider } from "./src/context/AuthContext";
import { SocketProvider } from "./src/context/SocketContext";

const linking = {
  prefixes: ["eventbuddy://"],
  config: {
    screens: {
      Main: "main",
      Splash: "splash",
      Login: "login",
      Register: "register",
      OtpVerify: "otp-verify",
      ProfileSetup: "profile-setup",
      PlanDetail: "plan/:id",
      GroupChat: "group-chat/:id",
      DirectChat: "direct-chat/:id",
      CreatePlan: "create-plan",
      NewMessage: "new-message",
      AddStory: "add-story",
      Credibility: "credibility",
      Notifications: "notifications",
      Settings: "settings",
      Map: "map",
    },
  },
};

export default function App() {
  useEffect(() => {
    // Initialize Firebase if not already done
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp();
      }
      console.log("[Firebase] Initialized successfully");
    } catch (error) {
      console.error("[Firebase] Initialization error:", error);
    }
  }, []);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <SocketProvider>
          <NavigationContainer
            linking={linking}
            fallback={null}
            onReady={() => {
              // Navigation is ready
            }}
          >
            <AppNavigator />
          </NavigationContainer>
        </SocketProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
