const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { requireCanInvite } = require('../middleware/inviteMiddleware');
const {
  requireBackofficeMember,
  requireTeamAdmin,
} = require('../middleware/backofficeMiddleware');
const {
  listMembers,
  inviteMember,
  deleteMember,
  memberHistory,
  projectProgress,
  getCanInvite,
  getAccess,
  updateMemberRole,
} = require('../controllers/backofficeController');

router.get('/access', protect, requireBackofficeMember, getAccess);

router.use(protect, requireBackofficeMember, requireTeamAdmin);

router.get('/can-invite', getCanInvite);
router.post('/invite', requireCanInvite, inviteMember);
router.get('/members', listMembers);
router.patch('/members/:id/role', updateMemberRole);
router.delete('/members/:id', deleteMember);
router.get('/members/:id/history', memberHistory);
router.get('/progress', projectProgress);

module.exports = router;
