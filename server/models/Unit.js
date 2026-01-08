import mongoose from 'mongoose';

const unitSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    head: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Can be User or Member, essentially who leads it
    },
}, {
    timestamps: true,
});

const Unit = mongoose.model('Unit', unitSchema);

export default Unit;
