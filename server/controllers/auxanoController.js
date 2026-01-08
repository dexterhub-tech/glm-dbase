import AuxanoCenter from '../models/AuxanoCenter.js';

// @desc    Get all centers
// @route   GET /api/auxano
// @access  Public
export const getCenters = async (req, res) => {
    try {
        const centers = await AuxanoCenter.find({}).populate('pastors', 'name email');
        res.json(centers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a center
// @route   POST /api/auxano
// @access  Private/Admin
export const createCenter = async (req, res) => {
    const { name, location, pastors } = req.body;

    try {
        const center = new AuxanoCenter({
            name,
            location,
            pastors,
        });

        const createdCenter = await center.save();
        res.status(201).json(createdCenter);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update a center
// @route   PUT /api/auxano/:id
// @access  Private/Admin
export const updateCenter = async (req, res) => {
    const { name, location, pastors } = req.body;

    try {
        const center = await AuxanoCenter.findById(req.params.id);

        if (center) {
            center.name = name || center.name;
            center.location = location || center.location;
            center.pastors = pastors || center.pastors;

            const updatedCenter = await center.save();
            res.json(updatedCenter);
        } else {
            res.status(404).json({ message: 'Center not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a center
// @route   DELETE /api/auxano/:id
// @access  Private/Admin
export const deleteCenter = async (req, res) => {
    try {
        const center = await AuxanoCenter.findById(req.params.id);

        if (center) {
            await center.deleteOne();
            res.json({ message: 'Center removed' });
        } else {
            res.status(404).json({ message: 'Center not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    Get center by ID
// @route   GET /api/auxano/:id
// @access  Public
export const getCenterById = async (req, res) => {
    try {
        const center = await AuxanoCenter.findById(req.params.id).populate('pastors', 'name email');
        if (center) {
            res.json(center);
        } else {
            res.status(404).json({ message: 'Center not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
