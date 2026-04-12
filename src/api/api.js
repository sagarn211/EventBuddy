import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import appConfig from "../config/appConfig";

// Use centralized API configuration
const API = axios.create({
  baseURL: appConfig.apiUrl,
  timeout: appConfig.apiTimeout,
});

// Interceptor to add JWT token to every request
API.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let logoutCallback = null;
export const setLogoutCallback = (cb) => {
  logoutCallback = cb;
};

// Response interceptor for error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - clear token
      AsyncStorage.removeItem("token");
      if (logoutCallback) {
        logoutCallback();
      }
    }
    return Promise.reject(error);
  }
);

export default API;
