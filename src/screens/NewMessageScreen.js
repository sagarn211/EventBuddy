import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  
  Image,
  SafeAreaView,
  ActivityIndicator,
  Modal,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { useAuth } from "../context/AuthContext";
import { getContacts, search } from "../api/userService";
import appConfig from "../config/appConfig";


const NewMessageScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [isGroupMode, setIsGroupMode] = useState(false);

  // Fetch contacts
  useFocusEffect(
    useCallback(() => {
      const fetchContacts = async () => {
        try {
          setLoading(true);
          const response = await getContacts();
          const contactsList = response.data?.data || [];
          setContacts(contactsList);
          setFilteredContacts(contactsList);
        } catch (error) {
          console.error("Error fetching contacts:", error);
          setContacts([]);
          setFilteredContacts([]);
        } finally {
          setLoading(false);
        }
      };
      fetchContacts();
    }, [user?._id])
  );

  // Search contacts
  const handleSearch = async (text) => {
    setSearchText(text);
    
    if (!text) {
      setFilteredContacts(contacts);
      return;
    }

    try {
      const response = await search(text);
      const searchResults = response.data?.data || [];
      // Filter out already selected contacts and current user
      const filtered = searchResults.filter(
        contact => contact._id !== user?._id && !selectedContacts.find(c => c._id === contact._id)
      );
      setFilteredContacts(filtered);
    } catch (error) {
      console.error("Error searching contacts:", error);
      setFilteredContacts([]);
    }
  };

  const toggleContactSelection = (contact) => {
    const isSelected = selectedContacts.find(c => c._id === contact._id);
    if (isSelected) {
      setSelectedContacts(selectedContacts.filter(c => c._id !== contact._id));
    } else {
      setSelectedContacts([...selectedContacts, contact]);
    }
  };

  const handleStartConversation = () => {
    if (selectedContacts.length === 0) return;

    if (selectedContacts.length === 1) {
      // Direct chat
      navigation.navigate("DirectChat", {
        buddy: selectedContacts[0],
        buddyId: selectedContacts[0]._id,
      });
    } else {
      // Group chat
      navigation.navigate("GroupChat", {
        participants: selectedContacts,
        isNewGroup: true,
        groupName: selectedContacts.map(c => c.firstName || c.name).join(", "),
      });
    }
  };

  const isContactSelected = (contactId) => {
    return selectedContacts.some(c => c._id === contactId);
  };

  return (
    <View className="flex-1 bg-[#111114]">
      {/* Background Ambience Blurs */}
      <View className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/[0.03] rounded-full" />
      <View className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/[0.03] rounded-full" />

      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <View className="flex-row items-center justify-between mb-6">
            <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={28} color="#d1d5db" />
            </TouchableOpacity>
            <Text className="text-2xl font-extrabold text-white tracking-tight flex-1 ml-3">
              New Message
            </Text>
            <TouchableOpacity
              onPress={() => setIsGroupMode(!isGroupMode)}
              className={`px-4 py-2 rounded-full ${
                isGroupMode ? "bg-purple-600" : "bg-[#1c1c24]"
              } border border-white/5`}
            >
              <Text className="text-xs font-bold text-white">
                {isGroupMode ? "GROUP" : "DIRECT"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View className="flex-row items-center bg-[#1c1c24] border border-white/5 rounded-2xl px-4 h-12 mb-4 shadow-lg">
            <Ionicons name="search" size={18} color="#6b7280" />
            <TextInput
              placeholder="Search contacts..."
              placeholderTextColor="#6b7280"
              className="flex-1 ml-3 text-white font-medium text-[14px]"
              value={searchText}
              onChangeText={handleSearch}
            />
            {searchText ? (
              <TouchableOpacity onPress={() => { setSearchText(""); setFilteredContacts(contacts); }}>
                <Ionicons name="close-circle" size={18} color="#9ca3af" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Selected Contacts Display */}
          {selectedContacts.length > 0 && (
            <View className="mb-4">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {selectedContacts.map((contact) => (
                  <View
                    key={contact._id}
                    className="flex-row items-center bg-purple-600/30 border border-purple-500/50 rounded-full pl-2 pr-3 py-1"
                  >
                    <Image
                      source={{
                        uri: contact.avatar || appConfig.defaultAvatar,
                      }}
                      className="w-6 h-6 rounded-full mr-2"
                    />

                    <Text className="text-xs font-semibold text-white">
                      {(contact.firstName || contact.name).substring(0, 10)}
                    </Text>
                    <TouchableOpacity onPress={() => toggleContactSelection(contact)} className="ml-2">
                      <Ionicons name="close" size={14} color="#d1d5db" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Contacts List */}
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {loading ? (
            <ActivityIndicator
              size="large"
              color="#a855f7"
              style={{ marginTop: 40 }}
            />
          ) : filteredContacts.length > 0 ? (
            <View className="px-4">
              <Text className="text-sm font-bold text-gray-500 mb-4 ml-2">
                {filteredContacts.length} contacts found
              </Text>
              {filteredContacts.map((contact, index) => {
                const isSelected = isContactSelected(contact._id);
                return (
                  <Animated.View
                    key={contact._id}
                    entering={FadeInDown.delay(index * 100).duration(500)}
                  >
                    <TouchableOpacity
                      onPress={() => toggleContactSelection(contact)}
                      activeOpacity={0.7}
                      className={`flex-row items-center p-4 mb-2 rounded-2xl border ${
                        isSelected
                          ? "bg-purple-600/20 border-purple-500/50"
                          : "bg-[#1c1c24]/30 border-white/5"
                      }`}
                    >
                      {/* Avatar */}
                      <View className="w-14 h-14 rounded-full overflow-hidden mr-4 border-2 border-white/10">
                        <Image
                          source={{
                            uri: contact.avatar || appConfig.defaultAvatar,
                          }}
                          className="w-full h-full"
                        />

                      </View>

                      {/* Contact Info */}
                      <View className="flex-1">
                        <Text className="text-base font-bold text-white mb-1">
                          {contact.firstName || contact.name}
                        </Text>
                        <Text className="text-xs text-gray-500">
                          {contact.email || "@" + (contact.username || "user")}
                        </Text>
                      </View>

                      {/* Selection Indicator */}
                      {isSelected && (
                        <View className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center">
                          <Ionicons name="checkmark" size={14} color="white" />
                        </View>
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          ) : (
            <View className="items-center justify-center mt-20">
              <Ionicons name="person-outline" size={48} color="#4b5563" />
              <Text className="text-gray-500 mt-4 font-bold text-lg">
                No contacts found
              </Text>
              <Text className="text-gray-600 text-sm mt-1">
                Search or add new contacts to start messaging
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Start Conversation Button */}
        {selectedContacts.length > 0 && (
          <View className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#111114] to-transparent">
            <TouchableOpacity
              onPress={handleStartConversation}
              activeOpacity={0.8}
              className="flex-row items-center justify-center w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 shadow-xl"
            >
              <Ionicons name="send" size={18} color="white" />
              <Text className="text-white font-bold ml-3">
                Start{" "}
                {selectedContacts.length === 1 ? "Chat" : "Group Chat"}
              </Text>
              <Text className="text-white/70 ml-2">
                ({selectedContacts.length})
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
};

export default NewMessageScreen;
