import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from './models/Student.js';

dotenv.config();

const deleteAllStudents = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        const result = await Student.deleteMany({});
        
        console.log('='.repeat(60));
        console.log(`✅ DELETED: ${result.deletedCount} students`);
        console.log('='.repeat(60));
        console.log('\n📊 Database is now empty.');
        console.log('Ready for new data upload!\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

deleteAllStudents();
