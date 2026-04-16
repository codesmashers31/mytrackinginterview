const mongoose = require('mongoose');
require('dotenv').config();

const testConnect = async () => {
    try {
        console.log('Attempting connection to:', process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI, {
            family: 4 // Force IPv4
        });
        console.log('SUCCESS: Connected to MongoDB');
        process.exit(0);
    } catch (error) {
        console.error('FAILED: Connection error:', error);
        process.exit(1);
    }
};

testConnect();
