import React, { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";
import { useAuth } from "./AuthContext";
import appConfig from "../config/appConfig";

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const { user, token } = useAuth();
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (user && appConfig.features.socket_enabled) {
            // Connect to socket server with proper authentication
            const newSocket = io(appConfig.socketUrl, {
                transports: ['websocket'],
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                reconnectionAttempts: 5,
                auth: {
                    token: token,
                    userId: user._id
                },
            });

            newSocket.on('connect', () => {
                console.log('[Socket] Connected with ID:', newSocket.id);
                setIsConnected(true);
                // Join user room
                newSocket.emit('join', user._id);
            });

            newSocket.on('disconnect', (reason) => {
                console.log('[Socket] Disconnected:', reason);
                setIsConnected(false);
            });

            newSocket.on('error', (error) => {
                console.error('[Socket] Error:', error);
            });

            newSocket.on('connect_error', (error) => {
                console.error('[Socket] Connection error:', error);
            });

            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
                setIsConnected(false);
            };
        }
    }, [user, token]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
