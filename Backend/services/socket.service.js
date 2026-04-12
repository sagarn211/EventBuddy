const { Server } = require("socket.io");

let io;

//Initialize socket
module.exports.initSocket = (server) =>{
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            credentials: true,
        },
        transports: ['websocket', 'polling'],
    });

    // Middleware for authentication
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        const userId = socket.handshake.auth.userId;
        
        if (!userId) {
            return next(new Error("Authentication error: Missing userId"));
        }
        
        socket.userId = userId;
        socket.token = token;
        next();
    });

    io.on("connection", (socket) =>{
        console.log(`[Socket] User ${socket.userId} connected with ID: ${socket.id}`);

        // Join user's personal room
        socket.on("join", (userId) => {
            socket.join(`user:${userId}`);
            console.log(`[Socket] User ${userId} joined personal room`);
        });

        // Join plan room for group chat
        socket.on("joinPlan", (planId) => {
            socket.join(`plan:${planId}`);
            console.log(`[Socket] User ${socket.userId} joined plan room: ${planId}`);
        });

        // Send message to plan
        socket.on("sendMessage", (data) => {
            if (data.planId) {
                io.to(`plan:${data.planId}`).emit("reciveMessage", {
                    ...data,
                    senderId: socket.userId,
                    timestamp: new Date()
                });
                console.log(`[Socket] Message sent to plan: ${data.planId}`);
            }
        });

        // Typing indicator
        socket.on("typing", (data) => {
            if (data.planId) {
                socket.to(`plan:${data.planId}`).emit("userTyping", {
                    userId: socket.userId,
                    planId: data.planId
                });
            }
        });

        // Stop typing
        socket.on("stopTyping", (data) => {
            if (data.planId) {
                socket.to(`plan:${data.planId}`).emit("userStoppedTyping", {
                    userId: socket.userId,
                    planId: data.planId
                });
            }
        });

        // Plan notifications
        socket.on("notifyPlanUpdate", (data) => {
            if (data.planId) {
                io.to(`plan:${data.planId}`).emit("planUpdated", data);
                console.log(`[Socket] Plan updated: ${data.planId}`);
            }
        });

        // User joined plan
        socket.on("userJoinedPlan", (data) => {
            if (data.planId) {
                io.to(`plan:${data.planId}`).emit("memberJoined", {
                    userId: socket.userId,
                    planId: data.planId,
                    userName: data.userName
                });
            }
        });

        // Direct messaging
        socket.on("joinDirectChat", (data) => {
            const { buddyId } = data;
            socket.join(`direct:${socket.userId}`);
            socket.join(`direct:${buddyId}`);
            console.log(`[Socket] User ${socket.userId} joined direct chat with ${buddyId}`);
        });

        // Send direct message
        socket.on("sendDirectMessage", (data) => {
            const { recipient, text } = data;
            io.to(`direct:${recipient}`).emit("directMessage", {
                sender: socket.userId,
                recipient,
                text,
                timestamp: new Date()
            });
            console.log(`[Socket] Direct message sent from ${socket.userId} to ${recipient}`);
        });

        // Online status
        socket.on("userOnline", (data) => {
            io.emit("user-online", { userId: socket.userId });
            console.log(`[Socket] User ${socket.userId} is online`);
        });

        // Offline status
        socket.on("userOffline", (data) => {
            io.emit("user-offline", { userId: socket.userId });
            console.log(`[Socket] User ${socket.userId} is offline`);
        });

        // Get active users
        socket.on("getActiveUsers", () => {
            const activeUsers = Array.from(io.sockets.sockets.keys()).map(socketId => {
                const s = io.sockets.sockets.get(socketId);
                return s?.userId;
            }).filter(Boolean);
            
            socket.emit("active-users", { users: activeUsers });
        });

        socket.on("disconnect", ()=> {
            io.emit("user-offline", { userId: socket.userId });
            console.log(`[Socket] User ${socket.userId} disconnected`);
        });

        socket.on("error", (error) => {
            console.error(`[Socket] Error from user ${socket.userId}:`, error);
        });
    });
};

//Get io instance
module.exports.getIO = () =>{
    if(!io){
        throw new Error("Socket not initialized");
    }
    return io;
};