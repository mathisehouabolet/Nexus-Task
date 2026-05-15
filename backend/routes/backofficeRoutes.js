const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/roleMiddleware');
const {
  listMembers,
  inviteMember,
  deleteMember,
  memberHistory,
  projectProgress,
} = require('../controllers/backofficeController');

router.use(protect, requireRoles(['admin', 'manager']));

router.get('/members', listMembers);
router.post('/invite', inviteMember);
router.delete('/members/:id', deleteMember);
router.get('/members/:id/history', memberHistory);
router.get('/progress', projectProgress);

module.exports = router;

