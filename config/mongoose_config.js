const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            ssl: true
        });
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
};

module.exports = {
    connectDB
}