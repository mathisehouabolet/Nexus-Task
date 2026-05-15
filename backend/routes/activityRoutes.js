const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getActivities, clearActivities } = require('../controllers/activityController');

router.get('/', protect, getActivities);
router.delete('/', protect, clearActivities);

module.exports = router;
