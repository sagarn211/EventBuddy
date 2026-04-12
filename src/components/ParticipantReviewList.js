import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import appConfig from '../config/appConfig';
import Animated, { FadeInUp, SlideInUp } from 'react-native-reanimated';

const ParticipantReviewList = ({ 
  isVisible, 
  onClose, 
  participants = [], 
  onReviewParticipant, 
  reviewedIds = [] 
}) => {
  const renderItem = ({ item, index }) => {
    const isReviewed = reviewedIds.includes(item._id);

    return (
      <Animated.View 
        entering={FadeInUp.delay(index * 100).duration(400)}
        className={`flex-row items-center justify-between p-4 mb-3 rounded-2xl bg-white/[0.03] border border-white/5 ${isReviewed ? 'opacity-50' : ''}`}
      >
        <View className="flex-row items-center gap-3">
          <Image 
            source={{ uri: item.avatar || appConfig.defaultAvatar }} 
            className="w-12 h-12 rounded-full border border-white/10"
          />
          <View>
            <Text className="text-white font-bold tracking-tight">{item.name || "Buddy"}</Text>
            <Text className="text-[10px] text-gray-500 uppercase tracking-widest">Joiner</Text>
          </View>
        </View>

        <TouchableOpacity 
          onPress={() => !isReviewed && onReviewParticipant(item)}
          disabled={isReviewed}
          className={`px-4 py-2 rounded-xl border ${isReviewed ? 'bg-transparent border-white/10' : 'bg-[#6366f1]/20 border-[#6366f1]/30'}`}
        >
          <Text className={`text-[11px] font-bold uppercase tracking-wider ${isReviewed ? 'text-gray-500' : 'text-[#6366f1]'}`}>
            {isReviewed ? "Reviewed" : "Rate"}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/80 items-center justify-end">
        <Animated.View 
          entering={SlideInUp.duration(600).springify()}
          className="w-full bg-[#111114] rounded-t-[40px] px-6 pt-8 pb-12 border-t border-white/5 shadow-2xl max-h-[80%]"
        >
          {/* Handle bar */}
          <View className="w-12 h-1.5 bg-white/10 rounded-full self-center mb-8" />

          <View className="flex-row justify-between items-center mb-6 px-2">
            <View>
              <Text className="text-2xl font-bold text-white tracking-tight">Review Participants</Text>
              <Text className="text-gray-500 text-xs mt-1">Select a buddy to share your experience</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="w-10 h-10 rounded-full bg-white/5 items-center justify-center">
              <Ionicons name="close" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={participants}
            renderItem={renderItem}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
            ListEmptyComponent={() => (
              <View className="py-20 items-center">
                <Ionicons name="people-outline" size={48} color="#374151" />
                <Text className="text-gray-500 mt-4 font-medium italic">No other participants joined this session.</Text>
              </View>
            )}
          />

          <TouchableOpacity 
            onPress={onClose}
            className="w-full h-16 bg-white/[0.03] border border-white/10 rounded-2xl items-center justify-center mt-4"
          >
            <Text className="text-white font-bold uppercase tracking-[2px]">Close</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default ParticipantReviewList;
