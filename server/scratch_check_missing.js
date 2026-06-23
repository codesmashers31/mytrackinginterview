import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from './models/Student.js';
import SplRegistration from './models/SplRegistration.js';
import User from './models/User.js';

dotenv.config();

const runCheck = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        const targets = [
            { name: 'Nithyasri k', email: 'nithyanithya3993@gmail.com', mobile: '6369346836' },
            { name: 'Aswitha', email: 'aswithavijayakumar1120@gmail.com', mobile: '7305197294' },
            { name: 'Swathi N', email: 'swathi.pkn@gmail.com', mobile: '7812875312' }
        ];

        for (const target of targets) {
            console.log(`==================== Looking up: ${target.name} ====================`);
            const student = await Student.findOne({
                $or: [
                    { email: target.email },
                    { mobile: target.mobile }
                ]
            });
            console.log('Student record:', student ? JSON.stringify(student, null, 2) : 'NOT FOUND');

            const spl = await SplRegistration.findOne({
                $or: [
                    { email: target.email },
                    { mobile: target.mobile }
                ]
            });
            console.log('SplRegistration record:', spl ? JSON.stringify(spl, null, 2) : 'NOT FOUND');

            const user = await User.findOne({
                $or: [
                    { email: target.mobile },
                    { email: target.email }
                ]
            });
            console.log('User record:', user ? JSON.stringify(user, null, 2) : 'NOT FOUND');
            console.log();
        }

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

runCheck();
