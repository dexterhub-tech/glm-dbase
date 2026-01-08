import AuxanoCenter from '../models/AuxanoCenter.js';
import Unit from '../models/Unit.js';
import User from '../models/User.js';

// @desc    Get all Auxano Centers
// @route   GET /api/lists/centers
// @access  Private
const getAuxanoCenters = async (req, res) => {
    try {
        const centers = await AuxanoCenter.find({}).select('name location');
        res.json(centers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all Units
// @route   GET /api/lists/units
// @access  Private
const getUnits = async (req, res) => {
    try {
        const units = await Unit.find({}).select('name');
        res.json(units);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all Pastors
// @route   GET /api/lists/pastors
// @access  Private
const getPastors = async (req, res) => {
    try {
        const pastors = await User.find({ role: 'pastor' }).select('name email');
        res.json(pastors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export { getAuxanoCenters, getUnits, getPastors };
