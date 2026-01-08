import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Profile from './models/Profile.js';

dotenv.config();

const checkUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const users = await User.find({});
        console.log('Users found:', users.length);
        users.forEach(u => {
            console.log(`- ${u.email}: ${u.role}`);
        });

        const superadmin = users.find(u => u.role === 'superadmin');
        if (!superadmin) {
            console.log('No superadmin found. Creating one...');
            const newUser = await User.create({
                email: 'superadmin@example.com',
                password: 'password123',
                role: 'superadmin',
                assignedAuxanoCenter: null
            });
            await Profile.create({
                user: newUser._id,
                email: newUser.email,
                full_name: 'Super Admin'
            });
            console.log(`Created superadmin: ${newUser.email} / password123`);
        } else {
            console.log('Superadmin exists.');
        }

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkUsers();
