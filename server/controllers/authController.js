import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import UserRole from '../models/UserRole.js';

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        const profile = await Profile.findOne({ user: user._id });

        res.json({
            user: {
                _id: user._id,
                email: user.email,
                role: user.role,
                assignedAuxanoCenter: user.assignedAuxanoCenter,
                profile,
            },
            token: generateToken(user._id),
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { email, password, full_name, role, assignedAuxanoCenter } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
        email,
        password,
        role: role || 'user',
        assignedAuxanoCenter
    });

    if (user) {
        // Create Profile
        const profile = await Profile.create({
            user: user._id,
            email: user.email,
            full_name: full_name || '',
        });

        // Create User Role (Keeping for backward compatibility if needed, but User.role is primary)
        await UserRole.create({
            user: user._id,
            role: user.role,
        });

        res.status(201).json({
            user: {
                _id: user._id,
                email: user.email,
                role: user.role,
                assignedAuxanoCenter: user.assignedAuxanoCenter,
                profile,
            },
            token: generateToken(user._id),
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        const profile = await Profile.findOne({ user: user._id });

        res.json({
            _id: user._id,
            email: user.email,
            profile,
            role: user.role,
            assignedAuxanoCenter: user.assignedAuxanoCenter,
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// @desc    Create a new user (Admin/Superadmin only)
// @route   POST /api/auth/create-user
// @access  Private/Admin
const createUser = async (req, res) => {
    const { email, password, full_name, role, assignedAuxanoCenter } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
        email,
        password,
        role: role || 'user',
        assignedAuxanoCenter
    });

    if (user) {
        // Create Profile
        const profile = await Profile.create({
            user: user._id,
            email: user.email,
            full_name: full_name || '',
        });

        // Create User Role (Optional, keeping consistent)
        await UserRole.create({
            user: user._id,
            role: user.role,
        });

        res.status(201).json({
            user: {
                _id: user._id,
                email: user.email,
                role: user.role,
                assignedAuxanoCenter: user.assignedAuxanoCenter,
                profile,
            }
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
};

// @desc    Get all users
// @route   GET /api/auth/users
// @access  Private/Admin
const getUsers = async (req, res) => {
    try {
        const users = await User.find({})
            .select('-password')
            .populate('assignedAuxanoCenter', 'name');

        // Fetch profiles separately or populate if we refactor profile to be a ref on user
        // For now, let's just return users. If we need profile data in the list, we might need a different query strategy
        // But the User model has the main info: email, role, assignedAuxanoCenter.
        // If names are in Profile model, we need to join them.

        // Let's do a quick aggregation or manual merge if needed. 
        // But actually, for a simple list, maybe email/role is enough? 
        // User requested "shows all users". Usually name is expected.
        // User model doesn't have name directly, only in Profile.

        // Better approach:
        const usersWithProfile = await Promise.all(users.map(async (user) => {
            const profile = await Profile.findOne({ user: user._id }).select('full_name');
            return {
                ...user.toObject(),
                profile
            };
        }));

        res.json(usersWithProfile);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export { authUser, registerUser, getUserProfile, createUser, getUsers };
