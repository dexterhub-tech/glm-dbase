import mongoose from 'mongoose';

const memberSchema = mongoose.Schema({
    fullname: { type: String },
    email: { type: String },
    phone: { type: String },
    category: { type: String },
    churchunit: { type: String },
    churchunits: [{ type: String }],
    assignedto: { type: String },
    status: {
        type: String,
        enum: ['pending', 'approved'],
        default: 'approved',
    },
    auxanoCenter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AuxanoCenter',
    },
    unit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Unit',
    },
    discipleshipStatus: {
        type: Boolean,
        default: false,
    },
    isactive: { type: Boolean, default: true },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

const Member = mongoose.model('Member', memberSchema);

export default Member;
