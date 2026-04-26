import { Platform } from "react-native";

let apiUrl;

// Deployed backend (Render)
apiUrl = "https://eventbuddy-ke1s.onrender.com";

// Override with environment variable if set
if (process.env.REACT_APP_API_URL) {
  apiUrl = process.env.REACT_APP_API_URL;
}

const appConfig = {
  apiUrl,
  defaultAvatar: "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg",

  
  // App-wide constants
  appName: "EventBuddy",
  version: "1.0.0",
  
  // Timeout for API requests in milliseconds
  apiTimeout: 10000,
  
  // Socket.io configuration
  socketUrl: apiUrl,
  socketTimeout: 10000,
  
  // Feature flags
  features: {
    socket_enabled: true,
    notifications_enabled: true,
    location_enabled: true,
  },
  
  // Luxury UI Theme
  luxuryTheme: {
    background: "#020205",
    card: "rgba(255, 255, 255, 0.03)",
    cardBorder: "rgba(255, 255, 255, 0.08)",
    primary: "#E5E7EB", // Silver / Slate 200
    secondary: "#9CA3AF", // Muted Gray
    accent: "#6366F1", // Indigo
    accentSecondary: "#4F46E5", // Deep Indigo
    gold: "#D4AF37", // Brushed Gold
    silver: "#C0C0C0", // Metallic Silver
    glassOpacity: 0.05,
    borderRadius: {
      lg: 24,
      xl: 30,
      full: 9999,
    }
  }
};

export default appConfig;
