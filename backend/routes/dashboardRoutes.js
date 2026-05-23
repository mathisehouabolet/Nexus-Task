const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { requireWorkspace } = require('../middleware/projectMiddleware');
const { getSummary, getFocusTask } = require('../controllers/dashboardController');

router.get('/summary', protect, requireWorkspace, getSummary);
router.get('/focus-task', protect, requireWorkspace, getFocusTask);

module.exports = router;
