import mongoose from 'mongoose';

const auxanoCenterSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    pastors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
}, {
    timestamps: true,
});

const AuxanoCenter = mongoose.model('AuxanoCenter', auxanoCenterSchema);

export default AuxanoCenter;
