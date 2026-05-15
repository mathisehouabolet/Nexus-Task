const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getSummary, getFocusTask } = require('../controllers/dashboardController');

router.get('/summary', protect, getSummary);
router.get('/focus-task', protect, getFocusTask);

module.exports = router;
