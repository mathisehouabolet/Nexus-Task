const express = require('express');
const router = express.Router();
const { registerWorkspace } = require('../controllers/onboardingController');

router.post('/register', registerWorkspace);

module.exports = router;

