import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import LinearGradient from "react-native-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useAuth } from "../context/AuthContext";

const { width, height } = Dimensions.get("window");

// Floating blob component
function FloatingBlob({ color, size, top, left, delay = 0 }) {
  const opacity = useSharedValue(0.2);
  const scale = useSharedValue(1);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.5, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.2, { duration: 2500, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      )
    );
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.15, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top,
          left,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

// Single bouncing dot
function BouncingDot({ color, delay }) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-10, { duration: 400, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 400, easing: Easing.in(Easing.quad) })
        ),
        -1,
        false
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        { width: 8, height: 8, borderRadius: 4, backgroundColor: color, marginHorizontal: 4 },
        style,
      ]}
    />
  );
}

// Logo float animation
function FloatingLogo({ children }) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-12, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}

export default function SplashScreen({ navigation }) {
  const { isLoading, token } = useAuth();

  const handleGetStarted = () => {
    navigation.replace(token ? "Main" : "Login");
  };

  return (
    <LinearGradient
      colors={["#0a0a15", "#0f0f2a", "#0a0a15"]}
      style={styles.container}
    >
      {/* Background Blobs */}
      <FloatingBlob color="#7c3aed" size={160} top={height * 0.15} left={width * 0.05} delay={0} />
      <FloatingBlob color="#2563eb" size={180} top={height * 0.55} left={width * 0.6} delay={800} />
      <FloatingBlob color="#db2777" size={120} top={height * 0.4} left={width * 0.65} delay={400} />

      {/* Particle dots */}
      {[
        { top: "20%", left: "20%", size: 4 },
        { top: "60%", left: "80%", size: 6 },
        { top: "80%", left: "30%", size: 5 },
        { top: "30%", left: "70%", size: 6 },
        { top: "50%", left: "50%", size: 4 },
      ].map((p, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            top: p.top,
            left: p.left,
            width: p.size,
            height: p.size,
            borderRadius: p.size / 2,
            backgroundColor: "#a855f7",
            opacity: 0.5,
          }}
        />
      ))}

      {/* Main Content */}
      <View style={styles.content}>

        {/* Logo Section */}
        <Animated.View entering={FadeIn.delay(200).duration(800)} style={styles.logoSection}>
          <FloatingLogo>
            <View style={styles.logoOuter}>
              {/* Glow ring */}
              <LinearGradient
                colors={["#7c3aed", "#2563eb", "#db2777"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.glowRing}
              />
              {/* Icon container */}
              <View style={styles.logoInner}>
                <Ionicons name="people" size={44} color="#a855f7" />
              </View>
            </View>
          </FloatingLogo>

          {/* Text */}
          <Animated.View entering={FadeInDown.delay(400).duration(700)} style={styles.textSection}>
            <Text style={styles.titleText}>
              Event{" "}
              <Text style={styles.titleGradient}>Buddy</Text>
            </Text>
            <Text style={styles.tagline}>Find Your People. Anywhere.</Text>
          </Animated.View>
        </Animated.View>

        {/* Bottom Section */}
        <Animated.View entering={FadeInUp.delay(600).duration(700)} style={styles.bottomSection}>
          {/* Bouncing Loading Dots */}
          <View style={styles.dotsRow}>
            <BouncingDot color="#7c3aed" delay={0} />
            <BouncingDot color="#2563eb" delay={150} />
            <BouncingDot color="#db2777" delay={300} />
          </View>

          {/* Get Started Button */}
          <TouchableOpacity
            onPress={handleGetStarted}
            activeOpacity={0.8}
            style={styles.buttonWrapper}
          >
            <LinearGradient
              colors={["rgba(124,58,237,0.3)", "rgba(37,99,235,0.3)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              <View style={styles.buttonBorder}>
                <Text style={styles.buttonText}>Get Started</Text>
                <Ionicons name="arrow-forward" size={18} color="rgba(255,255,255,0.9)" style={{ marginLeft: 8 }} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 80,
    paddingBottom: 50,
  },
  logoSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoOuter: {
    width: 112,
    height: 112,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  glowRing: {
    position: "absolute",
    width: 112,
    height: 112,
    borderRadius: 56,
    opacity: 0.6,
  },
  logoInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#0d0d1f",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  textSection: {
    alignItems: "center",
    marginTop: 8,
  },
  titleText: {
    fontSize: 42,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -0.5,
  },
  titleGradient: {
    color: "#a855f7",
  },
  tagline: {
    color: "rgba(156,163,175,0.8)",
    fontSize: 15,
    fontWeight: "500",
    letterSpacing: 0.5,
    marginTop: 8,
  },
  bottomSection: {
    width: "100%",
    alignItems: "center",
    gap: 20,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 32,
  },
  buttonWrapper: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
  },
  button: {
    borderRadius: 16,
    padding: 1,
  },
  buttonBorder: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  buttonText: {
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
    fontSize: 16,
  },
});
