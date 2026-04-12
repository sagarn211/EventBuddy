const mongoose = require('mongoose');

function connectDB(){
    const uri = process.env.MONGO_URI;
    if (!uri) {
        console.error("Missing MONGO_URI in environment (.env)");
        return;
    }
    mongoose.connect(uri)
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((err) =>{
        console.error('Error connecting to MongoDB:', err);
    });
}

module.exports = connectDB;
