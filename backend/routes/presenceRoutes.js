const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { ping, goOffline } = require('../controllers/presenceController');

router.post('/ping', protect, ping);
router.post('/offline', protect, goOffline);

module.exports = router;
