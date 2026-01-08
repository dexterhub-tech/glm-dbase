import Member from '../models/Member.js';

// @desc    Get all members
// @route   GET /api/members
// @access  Private
const getMembers = async (req, res) => {
    try {
        const { searchTerm, category, churchUnit, pastorId, isActive, status, auxanoCenter } = req.query;
        let query = {};

        // Search term filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            query.$or = [
                { fullname: { $regex: term, $options: 'i' } },
                { email: { $regex: term, $options: 'i' } },
                { phone: { $regex: term, $options: 'i' } }
            ];
        }

        // Category filter
        if (category) {
            query.category = category;
        }

        // Church unit filter
        if (churchUnit) {
            query.$or = [
                { unit: churchUnit }, // Assuming churchUnit query param is ID
                { churchunit: churchUnit },
                { churchunits: churchUnit }
            ];
        }

        // Pastor filter
        if (pastorId) {
            query.assignedto = pastorId;
        }

        // Active status filter
        if (isActive !== undefined) {
            query.isactive = isActive === 'true';
        }

        // Status filter (pending/approved)
        if (status) {
            query.status = status;
        }

        // Auxano Center filter (explicit)
        if (auxanoCenter) {
            query.auxanoCenter = auxanoCenter;
        }

        // Role-based filtering: Pastors only see members in their Assigned Auxano Center
        if (req.user && req.user.role === 'pastor' && req.user.assignedAuxanoCenter) {
            query.auxanoCenter = req.user.assignedAuxanoCenter;
        }

        const members = await Member.find(query)
            .populate('auxanoCenter')
            .populate('unit')
            .sort({ created_at: -1 });
        res.json(members);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single member
// @route   GET /api/members/:id
// @access  Private
const getMemberById = async (req, res) => {
    try {
        const member = await Member.findById(req.params.id);
        if (member) {
            res.json(member);
        } else {
            res.status(404).json({ message: 'Member not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a member
// @route   POST /api/members
// @access  Private
const createMember = async (req, res) => {
    try {
        const member = new Member(req.body);
        const createdMember = await member.save();
        res.status(201).json(createdMember);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update a member
// @route   PUT /api/members/:id
// @access  Private
const updateMember = async (req, res) => {
    try {
        const member = await Member.findById(req.params.id);

        if (member) {
            Object.assign(member, req.body);
            const updatedMember = await member.save();
            res.json(updatedMember);
        } else {
            res.status(404).json({ message: 'Member not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a member
// @route   DELETE /api/members/:id
// @access  Private
const deleteMember = async (req, res) => {
    try {
        const member = await Member.findById(req.params.id);

        if (member) {
            await member.deleteOne();
            res.json({ message: 'Member removed' });
        } else {
            res.status(404).json({ message: 'Member not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export {
    getMembers,
    getMemberById,
    createMember,
    updateMember,
    deleteMember,
    registerPublicMember,
    approveMember,
    assignToUnit,
    assignToAuxanoCenter,
};

// @desc    Register a member (Public)
// @route   POST /api/public/register-member
// @access  Public
const registerPublicMember = async (req, res) => {
    try {
        const { fullname, email, phone, category, discipleshipStatus } = req.body;

        // Check if member exists
        const memberExists = await Member.findOne({ email });
        if (memberExists) {
            return res.status(400).json({ message: 'Member already exists with this email' });
        }

        const member = await Member.create({
            fullname,
            email,
            phone,
            category,
            discipleshipStatus: discipleshipStatus === true || discipleshipStatus === 'true',
            status: 'pending', // Default to pending for public registration
            isactive: true
        });

        res.status(201).json(member);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Approve a member (Admin)
// @route   PUT /api/members/:id/approve
// @access  Private/Admin
const approveMember = async (req, res) => {
    try {
        const member = await Member.findById(req.params.id);

        if (member) {
            member.status = 'approved';
            const updatedMember = await member.save();
            res.json(updatedMember);
        } else {
            res.status(404).json({ message: 'Member not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Assign member to Unit (Admin)
// @route   PUT /api/members/:id/assign-unit
// @access  Private/Admin
const assignToUnit = async (req, res) => {
    try {
        const { unitId } = req.body;
        const member = await Member.findById(req.params.id);

        if (member) {
            member.unit = unitId;
            const updatedMember = await member.save();
            res.json(updatedMember);
        } else {
            res.status(404).json({ message: 'Member not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Assign member to Auxano Center (Pastor/Admin)
// @route   PUT /api/members/:id/assign-center
// @access  Private/Pastor/Admin
const assignToAuxanoCenter = async (req, res) => {
    try {
        const { auxanoCenterId } = req.body;
        const member = await Member.findById(req.params.id);

        if (member) {
            member.auxanoCenter = auxanoCenterId;
            const updatedMember = await member.save();
            res.json(updatedMember);
        } else {
            res.status(404).json({ message: 'Member not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
