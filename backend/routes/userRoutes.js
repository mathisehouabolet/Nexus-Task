const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getUsers,
  getUsersByRole,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  authUser,
  googleLogin
} = require('../controllers/userController');

// @desc    Get all users
// @route   GET /api/users
router.get('/', getUsers);

// @desc    Get users by role
// @route   GET /api/users/role/:role
router.get('/role/:role', getUsersByRole);

// @desc    Get user by ID
// @route   GET /api/users/:id
router.get('/:id', getUserById);

// @desc    Update user
// @route   PUT /api/users/:id
router.put('/:id', protect, updateUser);

// @desc    Delete user
// @route   DELETE /api/users/:id
router.delete('/:id', protect, deleteUser);

// @desc    Create a new user
// @route   POST /api/users
router.post('/', createUser);

// @desc    Auth user & get token
// @route   POST /api/users/login
router.post('/login', authUser);

// @desc    Google auth user & get token
// @route   POST /api/users/google-login
router.post('/google-login', googleLogin);

module.exports = router;
