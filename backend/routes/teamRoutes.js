const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { requireWorkspace } = require('../middleware/projectMiddleware');
const { getActiveTeam, getTeamMembers } = require('../controllers/teamController');

router.get('/active', protect, requireWorkspace, getActiveTeam);
router.get('/members', protect, requireWorkspace, getTeamMembers);

module.exports = router;
