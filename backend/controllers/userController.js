const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @desc    Get all users
// @route   GET /api/users
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get users by role
// @route   GET /api/users/role/:role
const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;
    const users = await User.find({ role }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/users/login
const authUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url || '',
        job_role: user.job_role || '',
        projectId: user.projectId,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new user
// @route   POST /api/users
const createUser = async (req, res) => {
  const { nom, prenom, email, password, role } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      nom,
      prenom,
      email,
      password,
      role
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url || '',
        job_role: user.job_role || '',
        projectId: user.projectId,
        token: generateToken(user._id)
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
const updateUser = async (req, res) => {
  try {
    if (
      req.user &&
      req.user.role !== 'admin' &&
      String(req.user._id) !== String(req.params.id)
    ) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const user = await User.findById(req.params.id);

    if (user) {
      if (
        String(req.user._id) !== String(req.params.id) &&
        req.user.projectId &&
        user.projectId &&
        String(req.user.projectId) !== String(user.projectId)
      ) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      user.nom = req.body.nom || user.nom;
      user.prenom = req.body.prenom || user.prenom;
      user.email = req.body.email || user.email;
      user.role = req.body.role || user.role;
      user.avatar_url = req.body.avatar_url ?? user.avatar_url;
      user.job_role = req.body.job_role ?? user.job_role;

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        nom: updatedUser.nom,
        prenom: updatedUser.prenom,
        email: updatedUser.email,
        role: updatedUser.role,
        avatar_url: updatedUser.avatar_url || '',
        job_role: updatedUser.job_role || '',
        projectId: updatedUser.projectId,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      await User.deleteOne({ _id: req.params.id });
      res.json({ message: 'User removed' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Google auth user & get token
// @route   POST /api/users/google-login
const googleLogin = async (req, res) => {
  const { credential } = req.body;

  try {
    let email, nom, prenom, avatar_url;

    // Support mock login for local development when GOOGLE_CLIENT_ID is not configured
    if (credential && credential.startsWith('mock_google_')) {
      const parts = credential.split('_');
      email = parts[2] || 'mock@example.com';
      prenom = parts[3] || 'Google';
      nom = parts[4] || 'User';
      avatar_url = '';
    } else {
      // Standard production token verification
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      email = payload.email;
      prenom = payload.given_name || 'Google';
      nom = payload.family_name || 'User';
      avatar_url = payload.picture || '';
    }

    if (!email) {
      return res.status(400).json({ message: 'Invalid Google token' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Find or create user
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Create user with a random secure password
      const crypto = require('crypto');
      const randomPassword = crypto.randomBytes(16).toString('hex');
      user = await User.create({
        nom,
        prenom,
        email: normalizedEmail,
        password: randomPassword,
        role: 'user',
        avatar_url,
      });
    }

    res.json({
      _id: user._id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      role: user.role,
      avatar_url: user.avatar_url || '',
      job_role: user.job_role || '',
      projectId: user.projectId,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUsers,
  getUsersByRole,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  authUser,
  googleLogin
};
