import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setLogoutCallback } from "../api/api";
import notificationService from "../services/notificationService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync logout function with API response interceptor
  useEffect(() => {
    setLogoutCallback(logout);
  }, []);

  // Load token and user from storage on app start
  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("token");
        const storedUser = await AsyncStorage.getItem("user");

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          console.log("[AUTH] Session restored from storage");
        } else {
          console.log("[AUTH] No existing session found");
        }
      } catch (error) {
        console.error("[AUTH] Error loading session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStorageData();
  }, []);

  // Sync FCM Token when user is available
  useEffect(() => {
    if (user && token) {
      const syncFcmToken = async () => {
        try {
          const hasPermission = await notificationService.requestUserPermission();
          if (hasPermission) {
            const fcmToken = await notificationService.getFcmToken();
            if (fcmToken) {
              await notificationService.updateTokenOnBackend(user._id, fcmToken);
            }
          }
        } catch (error) {
          console.error("[AUTH] FCM sync error:", error);
        }
      };

      syncFcmToken();
    }
  }, [user, token]);

  const login = async (newToken, newUser) => {
    await AsyncStorage.setItem("token", newToken);
    await AsyncStorage.setItem("user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setConfirmation(null); // Clear confirmation after successful login
  };

  const updateUser = async (updatedUser) => {
    const freshUser = { ...user, ...updatedUser };
    await AsyncStorage.setItem("user", JSON.stringify(freshUser));
    setUser(freshUser);
  };

  const logout = async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setConfirmation(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, confirmation, setConfirmation, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
