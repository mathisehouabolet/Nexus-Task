const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { requireCanInvite } = require('../middleware/inviteMiddleware');
const { requireBackofficeAccess } = require('../middleware/backofficeMiddleware');
const {
  listMembers,
  inviteMember,
  deleteMember,
  memberHistory,
  projectProgress,
  getCanInvite,
} = require('../controllers/backofficeController');

router.use(protect, requireBackofficeAccess);

router.get('/can-invite', getCanInvite);
router.post('/invite', requireCanInvite, inviteMember);
router.get('/members', listMembers);
router.delete('/members/:id', deleteMember);
router.get('/members/:id/history', memberHistory);
router.get('/progress', projectProgress);

module.exports = router;

