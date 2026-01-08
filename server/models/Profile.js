import mongoose from 'mongoose';

const profileSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    email: { type: String },
    full_name: { type: String },
    phone: { type: String },
    genotype: { type: String },
    address: { type: String },
    church_unit: { type: String },
    assigned_pastor: { type: String },
    date_of_birth: { type: Date },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

const Profile = mongoose.model('Profile', profileSchema);

export default Profile;
