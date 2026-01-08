import mongoose from 'mongoose';

const userRoleSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'user', 'superuser'],
        default: 'user',
    },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

const UserRole = mongoose.model('UserRole', userRoleSchema);

export default UserRole;
