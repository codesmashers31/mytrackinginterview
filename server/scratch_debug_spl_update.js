import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SplRegistration from './models/SplRegistration.js';
import User from './models/User.js';

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB\n');

        const splReg = await SplRegistration.findOne({ email: 'sarithasankari154@gmail.com' });
        if (!splReg) {
            console.error('SplRegistration not found');
            process.exit(1);
        }

        console.log('Original SplRegistration document:');
        console.log(JSON.stringify(splReg.toObject(), null, 2));

        // Create payload simulating Settings.jsx profileData
        const payload = {
            ...splReg.toObject(),
            city: 'Chennai Updated',
            skills: 'Python, Django, React, JS'
        };

        console.log('\n--- SIMULATING PUT UPDATE ---');
        const reg = await SplRegistration.findByIdAndUpdate(splReg._id, payload, { returnDocument: 'after' });
        console.log('\nUpdated result from findByIdAndUpdate:');
        console.log(JSON.stringify(reg.toObject(), null, 2));

        process.exit(0);
    } catch (e) {
        console.error('Error running test update:', e);
        process.exit(1);
    }
};

run();
