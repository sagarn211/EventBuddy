import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';

const ReviewModal = ({ 
  isVisible, 
  onClose, 
  onSubmit, 
  targetName = "the user", 
  isSubmitting = false 
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleRating = (val) => setRating(val);

  const handleSubmit = () => {
    if (rating === 0) return;
    onSubmit({ rating, comment });
  };

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1 bg-black/80 items-center justify-center px-6">
          <Animated.View 
            entering={SlideInUp.duration(500)}
            className="w-full bg-[#111114] rounded-[32px] border border-white/5 shadow-2xl overflow-hidden"
          >
            {/* Glossy Header Accent */}
            <View className="absolute top-0 left-0 right-0 h-32 bg-indigo-500/[0.05] rounded-full -translate-y-16" />
            
            <View className="p-8">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-xl font-bold text-white tracking-tight">Rate your experience</Text>
                <TouchableOpacity onPress={onClose} className="w-8 h-8 rounded-full bg-white/5 items-center justify-center">
                  <Ionicons name="close" size={20} color="#9ca3af" />
                </TouchableOpacity>
              </View>

              <Text className="text-gray-400 text-center mb-8 leading-5">
                How was your interaction with <Text className="text-white font-bold">{targetName}</Text>? Your feedback helps the community stay premium.
              </Text>

              {/* Star Rating */}
              <View className="flex-row justify-center gap-4 mb-10">
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity 
                    key={star} 
                    onPress={() => handleRating(star)}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name={star <= rating ? "star" : "star-outline"} 
                      size={44} 
                      color={star <= rating ? "#6366f1" : "#374151"} 
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Comment Input */}
              <View className="bg-white/5 rounded-2xl p-4 border border-white/5 mb-8">
                <TextInput
                  placeholder="Share a short note (optional)..."
                  placeholderTextColor="#4b5563"
                  className="text-white min-h-[100px] text-left"
                  textAlignVertical="top"
                  multiline
                  value={comment}
                  onChangeText={setComment}
                />
              </View>

              <TouchableOpacity 
                onPress={handleSubmit}
                disabled={rating === 0 || isSubmitting}
                activeOpacity={0.9}
                className={`overflow-hidden rounded-2xl ${rating === 0 ? 'opacity-50' : ''}`}
              >
                <LinearGradient
                  colors={['#6366f1', '#4338ca']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="h-16 items-center justify-center"
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white font-bold uppercase tracking-[2px]">Submit Review</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default ReviewModal;
