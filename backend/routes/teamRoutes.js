const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getActiveTeam, getTeamMembers } = require('../controllers/teamController');

router.get('/active', protect, getActiveTeam);
router.get('/members', protect, getTeamMembers);

module.exports = router;
