import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { getMessages, sendMessage as sendMessageApi, deleteMessage, editMessage } from "../api/messageService";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  Modal,
  Alert,
  Share,
  FlatList,
  Linking,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import ImagePicker from 'react-native-image-crop-picker';
import LinearGradient from "react-native-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import appConfig from "../config/appConfig";


const { width } = Dimensions.get("window");

// Emoji list
const EMOJI_LIST = ["😀", "😂", "😍", "🥰", "😘", "😊", "🎉", "🔥", "👍", "❤️", "✨", "😎", "🤔", "😅", "🙏", "💯"];

export default function GroupChatScreen({ route, navigation }) {
  const { plan } = route.params;
  const { user } = useAuth();
  const { socket } = useSocket();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState("");
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showMessageOptions, setShowMessageOptions] = useState(false);
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const [showGroupOptionsModal, setShowGroupOptionsModal] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showMembersList, setShowMembersList] = useState(false);
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const scrollViewRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await getMessages(plan._id);
        setMessages(response.data.data || []);
        scrollViewRef.current?.scrollToEnd({ animated: false });
      } catch (err) {
        console.error("Error fetching messages:", err);
        Alert.alert("Error", "Failed to load messages");
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    if (socket) {
      socket.emit("joinPlan", plan._id);

      socket.on("reciveMessage", (newMessage) => {
        if (newMessage.planId === plan._id) {
          setMessages((prev) => [...prev, newMessage]);
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }
      });

      // Listen for message updates (edits/deletes)
      socket.on("messageUpdated", (updatedMessage) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === updatedMessage._id ? updatedMessage : msg
          )
        );
      });

      socket.on("messageDeleted", (messageId) => {
        setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
      });

      // Listen for group typing
      socket.on("userTyping", (data) => {
        if (data.planId === plan._id && data.userId !== user._id) {
          setTypingUsers((prev) => {
            if (!prev.includes(data.userId)) {
              return [...prev, data.userId];
            }
            return prev;
          });
        }
      });

      socket.on("userStoppedTyping", (data) => {
        if (data.planId === plan._id) {
          setTypingUsers((prev) => prev.filter((id) => id !== data.userId));
        }
      });

      return () => {
        socket.off("reciveMessage");
        socket.off("messageUpdated");
        socket.off("messageDeleted");
        socket.off("userTyping");
        socket.off("userStoppedTyping");
      };
    }
  }, [plan._id, socket, user._id]);

  const handleSendMessage = async (text = null, mediaUrl = null, type = "text") => {
    if (!text?.trim() && !mediaUrl) return;

    const messageData = {
      planId: plan._id,
      sender: user._id,
      text: text || "",
      mediaUrl: mediaUrl || null,
      messageType: type,
      timestamp: new Date(),
    };

    try {
      if (type === "text") setMessage("");
      
      // Send via socket for real-time
      if (socket) {
        socket.emit("sendMessage", messageData);
        socket.emit("stoppedTyping", { userId: user._id, planId: plan._id });
      }
      
      // Save to database
      await sendMessageApi(messageData);
    } catch (err) {
      console.error("Error sending message:", err);
      Alert.alert("Error", "Failed to send message");
      if (type === "text") setMessage(text);
    }
  };

  const handlePickImage = async () => {
    try {
      const image = await ImagePicker.openPicker({
        width: 1200,
        height: 1600,
        cropping: true,
        compressImageQuality: 0.8,
      });

      setShowAttachmentMenu(false);
      setLoading(true);

      // MOCK UPLOAD LOGIC: 
      // To save server space, we upload to an external provider (Cloudinary/S3)
      // Here we simulate getting a URL back.
      // In production, replace this with a real upload call.
      setTimeout(() => {
        const mockExternalUrl = `https://picsum.photos/seed/${Math.random()}/800/600`;
        handleSendMessage("", mockExternalUrl, "image");
        setLoading(false);
      }, 1500);

    } catch (err) {
      if (err.code !== 'E_PICKER_CANCELLED') {
        console.error("Image pick error:", err);
        Alert.alert("Error", "Failed to pick image");
      }
      setLoading(false);
    }
  };

  const handleShareLocation = async () => {
    try {
      // Mocking location for now as full background GPS needs permissions
      // In a real app, use navigator.geolocation.getCurrentPosition
      const mockLocationUrl = "https://www.google.com/maps/search/?api=1&query=28.6139,77.2090";
      setShowAttachmentMenu(false);
      handleSendMessage(`Check out my location: ${mockLocationUrl}`, null, "location");
    } catch (err) {
      console.error("Location share error:", err);
    }
  };


  const handleTyping = () => {
    if (socket) {
      socket.emit("isTyping", { userId: user._id, planId: plan._id });
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stoppedTyping", { userId: user._id, planId: plan._id });
      }, 3000);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    Alert.alert(
      "Delete Message",
      "Are you sure you want to delete this message?",
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            try {
              await deleteMessage(messageId);
              if (socket) {
                socket.emit("deleteMessage", {
                  messageId,
                  planId: plan._id,
                  userId: user._id
                });
              }
              setShowMessageOptions(false);
              setSelectedMessage(null);
            } catch (err) {
              console.error("Error deleting message:", err);
              Alert.alert("Error", "Failed to delete message");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleEditMessage = async () => {
    if (!editText.trim() || !selectedMessage) return;

    try {
      await editMessage(selectedMessage._id, editText);
      if (socket) {
        socket.emit("editMessage", {
          messageId: selectedMessage._id,
          text: editText,
          planId: plan._id,
          userId: user._id
        });
      }
      setEditingMessageId(null);
      setEditText("");
      setShowMessageOptions(false);
      setSelectedMessage(null);
    } catch (err) {
      console.error("Error editing message:", err);
      Alert.alert("Error", "Failed to edit message");
    }
  };

  const handleCopyMessage = () => {
    if (selectedMessage?.text) {
      Share.share({ message: selectedMessage.text });
    }
    setShowMessageOptions(false);
  };

  const handleLongPressMessage = (msg) => {
    setSelectedMessage(msg);
    setShowMessageOptions(true);
  };

  const handleEmojiSelect = (emoji) => {
    setMessage(message + emoji);
  };

  const handleAddAttachment = () => {
    setShowAttachmentMenu(true);
  };

  const handleGroupMenu = () => {
    setShowGroupOptionsModal(true);
  };

  const getDateSeparator = (date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const messageDate = new Date(date);
    
    if (messageDate.toDateString() === today.toDateString()) return "Today";
    if (messageDate.toDateString() === yesterday.toDateString()) return "Yesterday";
    return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: messageDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });
  };

  const shouldShowDateSeparator = (currentMsg, prevMsg) => {
    if (!prevMsg) return true;
    const currentDate = new Date(currentMsg.createdAt).toDateString();
    const prevDate = new Date(prevMsg.createdAt).toDateString();
    return currentDate !== prevDate;
  };

  const getMessageStatus = (msg) => {
    if (msg.readBy?.length > 0) return '✓✓'; // Read by multiple
    if (msg.deliveredAt) return '✓✓'; // Delivered
    if (msg.sentAt) return '✓'; // Sent
    return '○'; // Pending
  };

  const filteredMessages = searchQuery.trim()
    ? messages.filter(msg => msg.text?.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  return (
    <View className="flex-1 bg-[#0a0a15]">
      {/* Background Ambience (Stable) */}
      <View className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-indigo-600/[0.05] rounded-full" />
      <View className="absolute bottom-[20%] right-[-10%] w-64 h-64 bg-indigo-900/[0.05] rounded-full" />
      <View className="absolute top-[40%] right-[-5%] w-48 h-48 bg-slate-800/[0.05] rounded-full" />

      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View className="px-5 pt-3 pb-3 flex-row items-center justify-between bg-[#0a0a15]/95 border-b border-white/5 z-20" style={{ paddingTop: Platform.OS === 'android' ? 40 : 12 }}>
          <View className="flex-row items-center flex-1 gap-4">
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center active:bg-gray-700"
            >
              <Ionicons name="arrow-back" size={20} color="#d1d5db" />
            </TouchableOpacity>

            <View className="flex-1">
              <View className="flex-row items-center gap-2 mb-0.5">
                <Text className="text-lg font-bold text-white tracking-tight">{plan.title}</Text>
                <View className="w-[22px] h-[22px] rounded-full flex items-center justify-center overflow-hidden">
                   <LinearGradient colors={['#b428d4', '#ec4899']} className="absolute inset-0" />
                   <Text className="text-[12px]">🎬</Text>
                </View>
              </View>
              <View className="flex-row items-center gap-2">
                <View className="flex-row -space-x-2">
                  {plan.participants?.slice(0, 2).map((participant, idx) => (
                    <Image 
                      key={idx}
                      source={{ uri: participant.avatar || appConfig.defaultAvatar }} 
                      className="w-5 h-5 rounded-full border border-[#111114]" 
                    />
                  ))}
                </View>
                <Text className="text-xs text-gray-400 font-medium tracking-wide">{plan.participants?.length || 1} participants</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity 
            onPress={() => setShowSearch(!showSearch)}
            className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center active:bg-gray-700"
          >
            <Ionicons name="search" size={20} color="#d1d5db" />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleGroupMenu}
            className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center active:bg-gray-700 ml-2"
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#d1d5db" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        {showSearch && (
          <Animated.View entering={FadeInDown} className="px-5 py-3 bg-[#0a0a15]/90 border-b border-white/5">
            <View className="flex-row items-center bg-gray-800 border border-gray-700 rounded-2xl px-4 h-[42px]">
              <Ionicons name="search" size={18} color="#6b7280" />
              <TextInput 
                placeholder="Search messages..."
                placeholderTextColor="#6b7280"
                className="flex-1 text-white text-[14px] ml-2"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={18} color="#6b7280" />
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        )}

        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : undefined} 
          className="flex-1"
        >
          <ScrollView
            ref={scrollViewRef}
            className="flex-1 px-5 pt-4"
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
          >
            {loading ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#818cf8" />
              </View>
            ) : filteredMessages.length > 0 ? filteredMessages.map((msg, index) => {
              const isMe = msg.sender === user?._id || msg.sender?._id === user?._id;
              const isEdited = msg.edited || false;
              const senderName = msg.senderName || msg.sender?.name || msg.sender?.firstName || "User";
              const showDateSeparator = shouldShowDateSeparator(msg, filteredMessages[index - 1]);
              return (
                <Animated.View 
                  key={msg._id || index} 
                  entering={FadeInDown.delay(100)}
                >
                  {showDateSeparator && (
                    <View className="flex-row items-center gap-3 my-4">
                      <View className="flex-1 h-px bg-white/10" />
                      <Text className="text-gray-500 text-xs font-semibold">{getDateSeparator(msg.createdAt)}</Text>
                      <View className="flex-1 h-px bg-white/10" />
                    </View>
                  )}
                  {editingMessageId === msg._id ? (
                    <View className={`flex-row items-center gap-3 mb-4 ${isMe ? 'justify-end' : ''}`}>
                      <View className="flex-1 bg-[#1a1a24] border border-white/10 rounded-2xl px-4 flex-row items-center min-h-[46px]">
                        <TextInput 
                          placeholder="Edit message..."
                          placeholderTextColor="#6b7280"
                          className="flex-1 text-white text-[14px]"
                          value={editText}
                          onChangeText={setEditText}
                          multiline
                        />
                      </View>
                      <TouchableOpacity 
                        onPress={handleEditMessage}
                        className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center"
                      >
                        <Ionicons name="checkmark" size={20} color="white" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => {
                          setEditingMessageId(null);
                          setEditText("");
                        }}
                        className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center"
                      >
                        <Ionicons name="close" size={20} color="white" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      onLongPress={() => handleLongPressMessage(msg)}
                      activeOpacity={0.8}
                      className={`flex-row items-end gap-3 mb-3 ${isMe ? 'justify-end' : ''}`}
                    >
                      {!isMe && (
                        <TouchableOpacity 
                          onPress={() => setSelectedMember(msg.sender)}
                          className="mb-1"
                        >
                          <Image 
                            source={{ uri: msg.sender?.avatar || appConfig.defaultAvatar }} 
                            className="w-8 h-8 rounded-full border border-white/10" 
                          />
                        </TouchableOpacity>
                      )}
                      <View className={`flex-1 ${isMe ? 'items-end' : 'items-start'}`}>
                        <View className="flex-row items-center gap-2 mb-1 px-1">
                          {!isMe && <Text className="text-[11px] font-bold text-cyan-400 tracking-wide">{senderName}</Text>}
                          <Text className="text-[9px] font-semibold text-gray-600">
                            {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>
                        <View 
                          className={`border rounded-2xl px-4 py-2 max-w-[85%] ${
                            isMe 
                              ? 'bg-indigo-600/30 border-indigo-500/30 rounded-tr-sm' 
                              : 'bg-gray-800 border-gray-700 rounded-tl-sm'
                          }`}
                        >
                          {msg.mediaUrl ? (
                            <TouchableOpacity 
                              activeOpacity={0.9}
                              onPress={() => {
                                // Expand image logic could go here
                              }}
                            >
                              <Image 
                                source={{ uri: msg.mediaUrl }} 
                                className="w-64 h-48 rounded-xl mb-2"
                                resizeMode="cover"
                              />
                            </TouchableOpacity>
                          ) : null}
                          
                          {msg.text ? (
                            <Text className={`text-[14px] leading-5 font-normal tracking-wide ${isMe ? 'text-[#fdf8ff]' : 'text-[#f3f4f6]'}`}>
                              {msg.text}
                            </Text>
                          ) : null}

                          {isEdited && (
                            <Text className="text-[8px] text-gray-600 mt-1 italic">edited</Text>
                          )}
                        </View>
                      </View>
                      {isMe && (
                        <View className="flex-row items-end gap-1 mb-1">
                          <Text className="text-[11px] text-gray-600 font-semibold">
                            {getMessageStatus(msg)}
                          </Text>
                          <Image 
                            source={{ uri: user?.avatar || appConfig.defaultAvatar }} 
                            className="w-8 h-8 rounded-full border border-pink-500/30" 
                          />
                        </View>
                      )}
                    </TouchableOpacity>
                  )}
                </Animated.View>
              );
            }) : (
              <View className="flex-1 items-center justify-center py-16">
                <Ionicons name={searchQuery ? "search" : "chatbubbles-outline"} size={48} color="#4b5563" />
                <Text className="text-gray-500 mt-4 font-bold text-lg">{searchQuery ? "No messages found" : "No messages yet"}</Text>
                <Text className="text-gray-600 text-sm mt-1">{searchQuery ? "Try a different search" : "Start the conversation!"}</Text>
              </View>
            )}

            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
              <View className="flex-row items-center gap-2 mb-4">
                <View className="flex-row gap-1">
                  <View className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                  <View className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <View className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                </View>
                <Text className="text-xs text-gray-400">
                  {typingUsers.length === 1 ? "Someone is" : "People are"} typing...
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Input Section */}
          <Animated.View entering={FadeInUp.delay(550)} className="bg-[#0a0a15]/98 border-t border-white/5 px-4 py-3 flex-col gap-2" style={{ paddingBottom: Platform.OS === 'ios' ? 34 : 12 }}>
            {/* Emoji Picker */}
            {showEmojiPicker && (
              <View className="bg-gray-800 border border-gray-700 rounded-lg p-3 flex-row flex-wrap gap-2">
                {EMOJI_LIST.map((emoji, index) => (
                  <TouchableOpacity 
                    key={index}
                    onPress={() => handleEmojiSelect(emoji)}
                    className="w-8 h-8 flex items-center justify-center"
                  >
                    <Text style={{ fontSize: 24 }}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Main Input Row */}
            <View className="flex-row items-center gap-2">
              <TouchableOpacity 
                onPress={handleAddAttachment}
                className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center"
              >
                <Ionicons name="add" size={24} color="#9ca3af" />
              </TouchableOpacity>
              
              <View className="flex-1 bg-gray-800 border border-gray-700 rounded-2xl px-4 flex-row items-center min-h-[46px]">
                <TextInput 
                  placeholder="Type a message..."
                  placeholderTextColor="#6b7280"
                  className="flex-1 text-white text-[14px]"
                  value={message}
                  onChangeText={(text) => {
                    setMessage(text);
                    handleTyping();
                  }}
                  multiline
                  maxHeight={100}
                />
                <TouchableOpacity
                  onPress={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="ml-2"
                >
                  <Ionicons name={showEmojiPicker ? "close" : "happy-outline"} size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                onPress={() => handleSendMessage(message)}
                disabled={!message.trim()}
                className={`w-12 h-12 rounded-full overflow-hidden ${!message.trim() ? 'opacity-40' : ''}`}
              >
                <LinearGradient 
                  colors={['#4f46e5', '#3730a3']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="w-full h-full items-center justify-center"
                >
                  <Ionicons name="send" size={18} color="white" style={{ transform: [{ rotate: '-45deg' }] }} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Attachment Menu Modal */}
      <Modal
        transparent
        visible={showAttachmentMenu}
        animationType="slide"
        onRequestClose={() => setShowAttachmentMenu(false)}
      >
        <TouchableOpacity 
          activeOpacity={1}
          onPress={() => setShowAttachmentMenu(false)}
          className="flex-1 bg-black/50"
        >
          <View className="flex-1 justify-end">
            <Animated.View 
              entering={FadeInUp.delay(100)}
              className="bg-[#0f0f1a] border-t border-white/5 rounded-t-3xl p-6"
            >
              {/* Handle Bar */}
              <View className="items-center mb-6">
                <View className="w-12 h-1 bg-gray-600 rounded-full" />
              </View>

              {/* Header */}
              <Text className="text-white text-xl font-bold mb-6 text-center">Share</Text>

              {/* Attachment Options */}
              <View className="gap-3">
                <TouchableOpacity
                  onPress={handlePickImage}
                  className="bg-[#2a2a34] border border-white/10 rounded-2xl p-4 flex-row items-center gap-4"
                >
                  <View className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Ionicons name="image" size={24} color="white" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white text-base font-semibold">Photo/Video</Text>
                    <Text className="text-gray-400 text-sm">Share photos or videos</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#6b7280" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleShareLocation}
                  className="bg-[#2a2a34] border border-white/10 rounded-2xl p-4 flex-row items-center gap-4"
                >
                  <View className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                    <Ionicons name="location" size={24} color="white" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white text-base font-semibold">Location</Text>
                    <Text className="text-gray-400 text-sm">Share your location</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#6b7280" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    Alert.alert("Files", "File sharing coming soon!");
                    setShowAttachmentMenu(false);
                  }}
                  className="bg-[#2a2a34] border border-white/10 rounded-2xl p-4 flex-row items-center gap-4"
                >
                  <View className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                    <Ionicons name="document" size={24} color="white" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white text-base font-semibold">File</Text>
                    <Text className="text-gray-400 text-sm">Share documents or files</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#6b7280" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    Alert.alert("Audio", "Audio sharing coming soon!");
                    setShowAttachmentMenu(false);
                  }}
                  className="bg-[#2a2a34] border border-white/10 rounded-2xl p-4 flex-row items-center gap-4"
                >
                  <View className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                    <Ionicons name="mic" size={24} color="white" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white text-base font-semibold">Audio</Text>
                    <Text className="text-gray-400 text-sm">Record and send audio</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>

              {/* Cancel Button */}
              <TouchableOpacity
                onPress={() => setShowAttachmentMenu(false)}
                className="bg-[#2a2a34] border border-white/10 rounded-2xl p-4 flex-row items-center justify-center gap-2 mt-6 mb-4"
              >
                <Ionicons name="close" size={20} color="#ef4444" />
                <Text className="text-red-500 text-base font-semibold">Cancel</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Message Options Modal */}
      <Modal
        transparent
        visible={showMessageOptions}
        animationType="fade"
        onRequestClose={() => setShowMessageOptions(false)}
      >
        <TouchableOpacity 
          activeOpacity={1}
          onPress={() => setShowMessageOptions(false)}
          className="flex-1 bg-black/70 flex items-center justify-center"
        >
          <View className="bg-[#1a1a24] border border-white/10 rounded-lg p-0 min-w-[250px]">
            {selectedMessage?.sender === user._id && (
              <>
                <TouchableOpacity 
                  onPress={() => {
                    setEditingMessageId(selectedMessage._id);
                    setEditText(selectedMessage.text);
                    setShowMessageOptions(false);
                  }}
                  className="px-4 py-3 border-b border-white/5 flex-row items-center gap-3"
                >
                  <Ionicons name="pencil" size={18} color="#d1d5db" />
                  <Text className="text-white text-base font-semibold">Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => handleDeleteMessage(selectedMessage._id)}
                  className="px-4 py-3 border-b border-white/5"
                >
                  <View className="flex-row items-center gap-3">
                    <Ionicons name="trash" size={18} color="#ef4444" />
                    <Text className="text-red-500 text-base font-semibold">Delete</Text>
                  </View>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity 
              onPress={handleCopyMessage}
              className="px-4 py-3 border-b border-white/5"
            >
              <View className="flex-row items-center gap-3">
                <Ionicons name="copy" size={18} color="#d1d5db" />
                <Text className="text-white text-base font-semibold">Copy</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setShowMessageOptions(false)}
              className="px-4 py-3"
            >
              <Text className="text-gray-400 text-base font-semibold text-center">Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Group Options Modal */}
      <Modal
        transparent
        visible={showGroupOptionsModal}
        animationType="fade"
        onRequestClose={() => setShowGroupOptionsModal(false)}
      >
        <TouchableOpacity 
          activeOpacity={1}
          onPress={() => setShowGroupOptionsModal(false)}
          className="flex-1"
        >
          <View className="absolute top-16 right-6 bg-[#1a1a24] border border-white/10 rounded-xl shadow-2xl overflow-hidden" style={{ width: 200 }}>
            <TouchableOpacity
              onPress={() => {
                setShowGroupOptionsModal(false);
                setShowMembersList(true);
              }}
              className="px-4 py-3 border-b border-white/5 flex-row items-center gap-3 active:bg-white/5"
            >
              <Ionicons name="people" size={18} color="#60a5fa" />
              <Text className="text-white text-sm font-semibold">View Members</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setShowGroupOptionsModal(false);
                setShowGroupInfoModal(true);
              }}
              className="px-4 py-3 border-b border-white/5 flex-row items-center gap-3 active:bg-white/5"
            >
              <Ionicons name="information-circle" size={18} color="#a78bfa" />
              <Text className="text-white text-sm font-semibold">Group Info</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setShowGroupOptionsModal(false);
                Alert.alert(
                  "Leave Group",
                  "Are you sure you want to leave this group?",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Leave",
                      onPress: () => {
                        navigation.goBack();
                      },
                      style: "destructive",
                    },
                  ]
                );
              }}
              className="px-4 py-3 flex-row items-center gap-3 active:bg-red-500/10"
            >
              <Ionicons name="exit" size={18} color="#ef4444" />
              <Text className="text-red-500 text-sm font-semibold">Leave Group</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Members List Modal */}
      <Modal
        transparent
        visible={showMembersList}
        animationType="slide"
        onRequestClose={() => setShowMembersList(false)}
      >
        <SafeAreaView className="flex-1 bg-[#111114]">
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-white/5">
            <TouchableOpacity 
              onPress={() => setShowMembersList(false)}
              className="w-10 h-10 rounded-full bg-[#1c1c24] border border-white/5 flex items-center justify-center"
            >
              <Ionicons name="arrow-back" size={20} color="#d1d5db" />
            </TouchableOpacity>
            <Text className="text-white text-lg font-bold">Members ({plan.participants?.length || 1})</Text>
            <View className="w-10" />
          </View>

          <ScrollView className="flex-1 px-5 py-4">
            {plan.participants?.map((member, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setSelectedMember(member)}
                className="flex-row items-center gap-4 py-4 border-b border-white/5 active:bg-white/5 px-2 rounded-lg"
              >
                <Image 
                  source={{ uri: member.avatar || appConfig.defaultAvatar }} 
                  className="w-12 h-12 rounded-full border border-white/10"
                />


                <View className="flex-1">
                  <Text className="text-white font-semibold text-base">{member.name || (member.firstName ? `${member.firstName} ${member.lastName || ''}` : 'User')}</Text>
                  <Text className="text-gray-400 text-sm">{member.email}</Text>
                </View>
                {member._id === user._id && (
                  <View className="bg-green-500/20 border border-green-500/40 px-2 py-1 rounded-full">
                    <Text className="text-green-400 text-xs font-semibold">You</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Member Profile Modal */}
      <Modal
        transparent
        visible={!!selectedMember}
        animationType="fade"
        onRequestClose={() => setSelectedMember(null)}
      >
        <TouchableOpacity 
          activeOpacity={1}
          onPress={() => setSelectedMember(null)}
          className="flex-1 bg-black/70 flex items-center justify-center"
        >
          <Animated.View 
            entering={FadeInDown}
            className="bg-[#1a1a24] border border-white/10 rounded-3xl p-6 w-[90%] max-w-sm"
          >
            <TouchableOpacity 
              onPress={() => setSelectedMember(null)}
              className="absolute top-4 right-4 z-10"
            >
              <Ionicons name="close-circle" size={28} color="#ef4444" />
            </TouchableOpacity>

            <View className="items-center">
              <Image 
                source={{ uri: selectedMember?.avatar || appConfig.defaultAvatar }} 
                className="w-24 h-24 rounded-full border-2 border-pink-500/30 mb-4"
              />


              <Text className="text-white text-xl font-bold tracking-wide">
                {selectedMember?.name || (selectedMember?.firstName ? `${selectedMember.firstName} ${selectedMember.lastName || ''}` : 'User')}
              </Text>
              <Text className="text-gray-400 text-sm mt-1 mb-4">{selectedMember?.email}</Text>
              
              {selectedMember?._id === user._id && (
                <View className="bg-green-500/20 border border-green-500/40 px-3 py-1 rounded-full mb-6">
                  <Text className="text-green-400 text-xs font-semibold">Your Profile</Text>
                </View>
              )}

              <View className="w-full bg-[#2a2a34] border border-white/10 rounded-2xl p-4 mb-4">
                <Text className="text-gray-400 text-xs font-semibold mb-2">BIO</Text>
                <Text className="text-white text-sm">
                  {selectedMember?.bio || "No bio shared"}
                </Text>
              </View>

              {selectedMember?._id !== user._id && (
                <View className="w-full gap-3">
                  <TouchableOpacity className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl py-3 flex items-center justify-center">
                    <Ionicons name="chatbubble-ellipses" size={18} color="white" />
                    <Text className="text-white font-semibold text-sm mt-1">Send Message</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* Group Info Modal */}
      <Modal
        transparent
        visible={showGroupInfoModal}
        animationType="fade"
        onRequestClose={() => setShowGroupInfoModal(null)}
      >
        <TouchableOpacity 
          activeOpacity={1}
          onPress={() => setShowGroupInfoModal(false)}
          className="flex-1 bg-black/70 flex items-center justify-center px-6"
        >
          <Animated.View 
            entering={FadeInDown}
            className="bg-[#1a1a24] border border-white/10 rounded-[32px] p-8 w-full max-w-sm overflow-hidden"
          >
            {/* Design Elements */}
            <View className="absolute -top-10 -right-10 w-32 h-32 bg-purple-600/10 rounded-full" />
            <View className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-600/10 rounded-full" />

            <View className="items-center">
              <View className="w-16 h-16 rounded-[22px] items-center justify-center mb-6 overflow-hidden relative">
                 <LinearGradient 
                   colors={['#4f46e5', '#a855f7']} 
                   className="absolute inset-0"
                   start={{ x: 0, y: 0 }}
                   end={{ x: 1, y: 1 }}
                 />
                 <Ionicons name="information-circle" size={32} color="white" />
              </View>

              <Text className="text-white text-2xl font-bold text-center mb-2 tracking-tight">Group Details</Text>
              <Text className="text-gray-400 text-sm text-center mb-8 px-4">Technical information about this group circle.</Text>

              <View className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-4 gap-4 mb-8">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <Ionicons name="calendar-outline" size={18} color="#9ca3af" />
                    <Text className="text-gray-300 text-sm font-medium">Created On</Text>
                  </View>
                  <Text className="text-white text-sm font-bold">{new Date(plan.createdAt).toLocaleDateString()}</Text>
                </View>

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <Ionicons name="shield-checkmark-outline" size={18} color="#9ca3af" />
                    <Text className="text-gray-300 text-sm font-medium">Type</Text>
                  </View>
                  <Text className="text-[#a78bfa] text-xs font-bold font-mono tracking-widest uppercase">Verified</Text>
                </View>
              </View>

              <TouchableOpacity 
                onPress={() => setShowGroupInfoModal(false)}
                className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl items-center justify-center active:bg-white/10"
              >
                <Text className="text-white font-bold tracking-widest uppercase text-xs">Close</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
