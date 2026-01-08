import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../server/models/User.js';

dotenv.config({ path: './server/.env' });

const checkUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const users = await User.find({});
        console.log('Users found:', users.length);
        users.forEach(u => {
            console.log(`- ${u.email}: ${u.role}`);
        });

        // Optional: Create a superadmin if none exists
        const superadmin = users.find(u => u.role === 'superadmin');
        if (!superadmin) {
            console.log('No superadmin found. Creating one...');
            // existing password hash logic in model will handle it
            const newUser = await User.create({
                email: 'superadmin@example.com',
                password: 'password123',
                role: 'superadmin',
                full_name: 'Super Admin'
            });
            console.log(`Created superadmin: ${newUser.email} / password123`);
        }

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkUsers();
