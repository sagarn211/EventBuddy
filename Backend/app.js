const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const path = require("path");
dotenv.config({ path: path.join(__dirname, ".env") });
const express = require('express');
const cors = require("cors");
const app = express();
const connectDB = require('./db/db')

const authRoutes = require('./routes/auth.routes');
const badgeRoutes = require('./routes/badge.routes');
const messageRoutes = require('./routes/message.routes');
const notificationRoutes = require('./routes/notification.routes')
const planRoutes = require('./routes/plan.routes');
const reviewRoutes = require('./routes/review.routes');
const userRoutes = require('./routes/user.routes');
const uploadRoutes = require('./routes/upload.routes');
const storyRoutes = require('./routes/story.routes');
const friendshipRoutes = require('./routes/friendship.routes');

connectDB();



const corsOptions = {
    origin: true, // Allow all origins
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/users', userRoutes);
app.use('/auth', authRoutes);
app.use('/badges', badgeRoutes);
app.use('/messages', messageRoutes);
app.use('/notifications', notificationRoutes);
app.use('/plans', planRoutes);
app.use('/reviews', reviewRoutes);
app.use('/upload', uploadRoutes);
app.use('/stories', storyRoutes);
app.use('/friends', friendshipRoutes);




app.get('/',(req, res) =>{
    res.send('Hello World')
});

module.exports = app;
