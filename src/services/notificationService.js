import messaging from '@react-native-firebase/messaging';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import appConfig from '../config/appConfig';

class NotificationService {
    async requestUserPermission() {
        if (Platform.OS === 'android' && Platform.Version >= 33) {
            const authStatus = await messaging().requestPermission();
            const enabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;

            if (enabled) {
                console.log('Authorization status:', authStatus);
                return true;
            }
        } else {
            // iOS or older Android
            const authStatus = await messaging().requestPermission();
            const enabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;

            if (enabled) {
                return true;
            }
        }
        return false;
    }

    async getFcmToken() {
        try {
            const fcmToken = await messaging().getToken();
            if (fcmToken) {
                console.log('[NOTIFICATION] FCM Token:', fcmToken);
                return fcmToken;
            }
        } catch (error) {
            console.log('[NOTIFICATION] Error getting token:', error);
        }
        return null;
    }

    async updateTokenOnBackend(userId, token) {
        if (!userId || !token) return;
        
        try {
            const storedToken = await AsyncStorage.getItem("userToken");
            if (!storedToken) return;

            await axios.put(`${appConfig.apiUrl}/users/fcm-token`, { 
                fcmToken: token 
            }, {
                headers: { Authorization: `Bearer ${storedToken}` }
            });
            console.log('[NOTIFICATION] FCM Token updated on backend');
        } catch (error) {
            console.log('[NOTIFICATION] Error updating token on backend:', error);
        }
    }

    // Set up foreground notification listener
    onMessage(callback) {
        return messaging().onMessage(async remoteMessage => {
            console.log('[NOTIFICATION] Foreground message:', remoteMessage);
            if (callback) callback(remoteMessage);
        });
    }

    // Set up background handler (must be called outside any component)
    static setBackgroundHandler() {
        messaging().setBackgroundMessageHandler(async remoteMessage => {
            console.log('[NOTIFICATION] Background message handler:', remoteMessage);
        });
    }
}

export default new NotificationService();
