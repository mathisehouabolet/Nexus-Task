const express = require('express');
const router = express.Router();
const { registerWorkspace, getProjectInfo } = require('../controllers/onboardingController');

router.post('/register', registerWorkspace);
router.get('/project/:id', getProjectInfo);

module.exports = router;

