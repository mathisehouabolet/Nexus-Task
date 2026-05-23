const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { requireWorkspace } = require('../middleware/projectMiddleware');
const { getActivities, clearActivities } = require('../controllers/activityController');

router.get('/', protect, requireWorkspace, getActivities);
router.delete('/', protect, requireWorkspace, clearActivities);

module.exports = router;
