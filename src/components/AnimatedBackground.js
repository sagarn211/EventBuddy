import React, { useEffect } from "react";
import { StyleSheet, View, Dimensions } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

const Particle = ({ delay, duration, startPos }) => {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(-height, {
          duration,
          easing: Easing.linear,
        }),
        -1,
        false
      )
    );
    translateX.value = withDelay(
      delay,
      withRepeat(
        withTiming(Math.random() * 50 - 25, {
          duration: duration / 2,
          easing: Easing.inOut(Easing.quad),
        }),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        { left: startPos.x, top: startPos.y },
        animatedStyle,
      ]}
    />
  );
};

const AnimatedBackground = ({ children }) => {
  const blob1Pos = useSharedValue(0);
  const blob2Pos = useSharedValue(0);

  useEffect(() => {
    blob1Pos.value = withRepeat(
      withTiming(1, { duration: 12000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
    blob2Pos.value = withRepeat(
      withTiming(1, { duration: 15000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, []);

  const blob1Style = useAnimatedStyle(() => ({
    transform: [
      { scale: 1 + blob1Pos.value * 0.2 },
      { translateX: blob1Pos.value * 20 },
    ],
  }));

  const blob2Style = useAnimatedStyle(() => ({
    transform: [
      { scale: 1 + blob2Pos.value * 0.3 },
      { translateX: -blob2Pos.value * 30 },
    ],
  }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#020205", "#050510", "#020205"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Atmospheric Blobs (Muted Indigo & Charcoal for Luxury Feel) */}
      <Animated.View
        style={[styles.blob, styles.blobIndigo, blob1Style, { top: "10%", left: "-10%" }]}
      />
      <Animated.View
        style={[styles.blob, styles.blobCharcoal, blob2Style, { bottom: "15%", right: "-5%" }]}
      />
      <Animated.View
        style={[styles.blob, styles.blobMidnight, { top: "40%", right: "15%", opacity: 0.1 }]}
      />

      {/* Subtle Particles */}
      {[...Array(4)].map((_, i) => (
        <Particle
          key={i}
          delay={i * 1500}
          duration={8000 + Math.random() * 4000}
          startPos={{
            x: Math.random() * width,
            y: height + 20,
          }}
        />
      ))}

      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020205",
  },
  blob: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 125,
    opacity: 0.2,
  },
  blobIndigo: {
    backgroundColor: "#6366F1", // Indigo 500
    shadowColor: "#6366F1",
    shadowRadius: 150,
    shadowOpacity: 0.3,
    elevation: 20,
  },
  blobCharcoal: {
    backgroundColor: "#1F2937", // Gray 800
    shadowColor: "#111827",
    shadowRadius: 150,
    shadowOpacity: 0.4,
    elevation: 20,
  },
  blobMidnight: {
    backgroundColor: "#4F46E5", // Deep Indigo
    shadowColor: "#4F46E5",
    shadowRadius: 120,
    shadowOpacity: 0.2,
    elevation: 20,
  },
  particle: {
    position: "absolute",
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
});

export default AnimatedBackground;
