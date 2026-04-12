import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { getDirectMessages, sendDirectMessage, deleteMessage, editMessage } from "../api/messageService";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  Modal,
  Alert,
  FlatList,
  Share,
  ActionSheetIOS,
  Keyboard,
  Linking,
} from "react-native";
import ImagePicker from 'react-native-image-crop-picker';
import LinearGradient from "react-native-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import appConfig from "../config/appConfig";


const { width } = Dimensions.get("window");

// Emoji list
const EMOJI_LIST = ["😀", "😂", "😍", "🥰", "😘", "😊", "🎉", "🔥", "👍", "❤️", "✨", "😎", "🤔", "😅", "🙏", "💯"];

export default function DirectChatScreen({ route, navigation }) {
  const { buddy, buddyId } = route.params;
  const { user } = useAuth();
  const { socket } = useSocket();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState("");
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showMessageOptions, setShowMessageOptions] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await getDirectMessages(buddyId);
        setMessages(response.data.data || []);
        scrollViewRef.current?.scrollToEnd({ animated: false });
      } catch (err) {
        console.error("Error fetching direct messages:", err);
        Alert.alert("Error", "Failed to load messages");
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    if (socket) {
      // Join direct chat room
      socket.emit("joinDirectChat", { userId: user._id, buddyId });

      // Listen for direct messages
      socket.on("directMessage", (newMessage) => {
        if ((newMessage.sender === buddyId && newMessage.recipient === user._id) ||
            (newMessage.sender === user._id && newMessage.recipient === buddyId)) {
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

      // Listen for typing indicator
      socket.on("userTyping", (data) => {
        if (data.userId === buddyId) {
          setIsTyping(true);
        }
      });

      socket.on("userStoppedTyping", (data) => {
        if (data.userId === buddyId) {
          setIsTyping(false);
        }
      });

      // Listen for buddy online status
      socket.on("userOnline", (data) => {
        if (data.userId === buddyId) {
          setIsOnline(true);
        }
      });

      socket.on("userOffline", (data) => {
        if (data.userId === buddyId) {
          setIsOnline(false);
        }
      });

      return () => {
        socket.off("directMessage");
        socket.off("messageUpdated");
        socket.off("messageDeleted");
        socket.off("userTyping");
        socket.off("userStoppedTyping");
        socket.off("userOnline");
        socket.off("userOffline");
      };
    }
  }, [buddyId, user._id, socket]);

  const handleSendMessage = async (text = null, mediaUrl = null, type = "text") => {
    if (!text?.trim() && !mediaUrl) return;

    const messageData = {
      recipient: buddyId,
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
        socket.emit("sendDirectMessage", messageData);
        // stoppedTyping logic here too
      }
      
      // Save to database
      await sendDirectMessage(buddyId, text || "", mediaUrl, type);
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
      const mockLocationUrl = "https://www.google.com/maps/search/?api=1&query=28.6139,77.2090";
      setShowAttachmentMenu(false);
      handleSendMessage(`My current location: ${mockLocationUrl}`, null, "location");
    } catch (err) {
      console.error("Location share error:", err);
    }
  };


  const handleTyping = () => {
    if (socket) {
      socket.emit("isTyping", { userId: user._id, buddyId });
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing after 3 seconds
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stoppedTyping", { userId: user._id, buddyId });
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
                socket.emit("deleteDirectMessage", {
                  messageId,
                  userId: user._id,
                  buddyId
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
        socket.emit("editDirectMessage", {
          messageId: selectedMessage._id,
          text: editText,
          userId: user._id,
          buddyId
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

  // handPickImage is now handlePickImage and defined above


  const handleCall = () => {
    Alert.alert(
      "Start Call",
      `Start a call with ${buddy?.firstName || buddy?.name}?`,
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        {
          text: "Voice Call",
          onPress: () => {
            // Navigate to call screen or initiate call
            Alert.alert("Voice Call", "Initiating voice call...");
          },
        },
        {
          text: "Video Call",
          onPress: () => {
            // Navigate to video call screen
            Alert.alert("Video Call", "Initiating video call...");
          },
        },
      ]
    );
  };

  const handleAddAttachment = () => {
    setShowAttachmentMenu(true);
  };

  const handleLongPressMessage = (msg) => {
    setSelectedMessage(msg);
    setShowMessageOptions(true);
  };

  const handleEmojiSelect = (emoji) => {
    setMessage(message + emoji);
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
    if (msg.readAt) return '✓✓'; // Read
    if (msg.deliveredAt) return '✓✓'; // Delivered
    if (msg.sentAt) return '✓'; // Sent
    return '○'; // Pending
  };

  const filteredMessages = searchQuery.trim()
    ? messages.filter(msg => msg.text?.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  return (
    <View className="flex-1 bg-[#111114]">
      {/* Stable Background Ambience */}
      <View className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-purple-600/[0.05] rounded-full" />
      <View className="absolute bottom-[20%] right-[-10%] w-64 h-64 bg-blue-600/[0.05] rounded-full" />
      <View className="absolute top-[40%] right-[-5%] w-48 h-48 bg-pink-600/[0.05] rounded-full" />

      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View className="px-5 pt-3 pb-3 flex-row items-center justify-between bg-[#111114]/90 border-b border-white/5 z-20" style={{ paddingTop: Platform.OS === 'android' ? 40 : 12 }}>
          <View className="flex-row items-center flex-1 gap-4">
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              className="w-10 h-10 rounded-full bg-[#1c1c24] border border-white/5 flex items-center justify-center transform transition-all active:bg-white/10"
            >
              <Ionicons name="arrow-back" size={20} color="#d1d5db" />
            </TouchableOpacity>

            <View className="flex-row items-center flex-1 gap-3">
              <Image 
                source={{ uri: buddy?.avatar || appConfig.defaultAvatar }} 
                className="w-10 h-10 rounded-full border border-white/10"
              />
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="text-lg font-bold text-white tracking-tight">
                    {buddy?.firstName || buddy?.name}
                  </Text>
                  {isOnline && (
                    <View className="w-2 h-2 bg-green-500 rounded-full" />
                  )}
                </View>
                <Text className="text-xs text-gray-400 font-medium">
                  {isTyping ? "Typing..." : isOnline ? "Active now" : "Offline"}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity 
            onPress={() => setShowSearch(!showSearch)}
            className="w-10 h-10 rounded-full bg-[#1c1c24] border border-white/5 flex items-center justify-center transform transition-all active:bg-white/10"
          >
            <Ionicons name="search" size={20} color="#d1d5db" />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleCall}
            className="w-10 h-10 rounded-full bg-[#1c1c24] border border-white/5 flex items-center justify-center transform transition-all active:bg-white/10 ml-2"
          >
            <Ionicons name="call-outline" size={20} color="#d1d5db" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        {showSearch && (
          <Animated.View entering={FadeInDown} className="px-5 py-3 bg-[#111114]/90 border-b border-white/5">
            <View className="flex-row items-center bg-[#1a1a24] border border-white/10 rounded-2xl px-4 h-[42px]">
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
                <ActivityIndicator size="large" color="#a855f7" />
              </View>
            ) : filteredMessages.length > 0 ? filteredMessages.map((msg, index) => {
              const isMe = msg.sender === user?._id || msg.sender?._id === user?._id;
              const isEdited = msg.edited || false;
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
                      className={`flex-row items-end gap-2 mb-3 ${isMe ? 'justify-end' : ''}`}
                    >
                      {!isMe && (
                        <Image 
                          source={{ uri: buddy?.avatar || appConfig.defaultAvatar }} 
                          className="w-8 h-8 rounded-full mb-1 border border-white/10" 
                        />
                      )}
                      <View className={`flex-1 ${isMe ? 'items-end' : 'items-start'}`}>
                        <View className="flex-row items-center gap-2 mb-1 px-1">
                          <Text className="text-[9px] font-semibold text-gray-600">
                            {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>
                        <View 
                          className={`border rounded-2xl px-4 py-2 max-w-[85%] ${
                            isMe 
                               ? 'bg-[#4d2c5e]/80 border-pink-500/20 rounded-tr-sm shadow-sm' 
                               : 'bg-[#1c1c24] border-white/5 rounded-tl-sm'
                          }`}
                          style={isMe ? {
                             elevation: 4,
                             shadowColor: '#ec4899',
                             shadowOffset: { width: 0, height: 2 },
                             shadowOpacity: 0.15,
                             shadowRadius: 5,
                           } : {}}
                        >
                          {msg.mediaUrl ? (
                            <TouchableOpacity activeOpacity={0.9}>
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
                            className="w-8 h-8 rounded-full mb-0.5 border border-pink-500/30" 
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
                <Text className="text-gray-600 text-sm mt-1">{searchQuery ? "Try a different search" : "Start a conversation!"}</Text>
              </View>
            )}

          </ScrollView>

          {/* Input Section */}
          <Animated.View entering={FadeInUp.delay(550)} className="bg-[#111114]/95 border-t border-white/5 px-4 py-3 flex-col gap-2" style={{ paddingBottom: Platform.OS === 'ios' ? 34 : 12 }}>
            {/* Emoji Picker */}
            {showEmojiPicker && (
              <View className="bg-[#1a1a24] border border-white/10 rounded-lg p-3 flex-row flex-wrap gap-2">
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
                className="w-10 h-10 rounded-full bg-[#1c1c24] border border-white/10 flex items-center justify-center"
              >
                <Ionicons name="add" size={24} color="#9ca3af" />
              </TouchableOpacity>
              
              <View className="flex-1 bg-[#1a1a24] border border-white/10 rounded-2xl px-4 flex-row items-center min-h-[46px]">
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
                className={`w-12 h-12 rounded-full overflow-hidden shadow-md ${!message.trim() ? 'opacity-50' : ''}`}
                style={message.trim() ? {
                  elevation: 10,
                  shadowColor: '#ec4899',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.4,
                  shadowRadius: 8,
                } : {}}
              >
                <LinearGradient 
                  colors={['#b428d4', '#f13f8d']}
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
              className="bg-[#1a1a24] border-t border-white/10 rounded-t-3xl p-6"
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
    </View>
  );
}
