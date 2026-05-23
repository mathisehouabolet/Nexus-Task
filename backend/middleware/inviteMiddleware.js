const Project = require('../models/Project');
const { getProjectIdForUser } = require('../utils/projectScope');

async function userCanInvite(user) {
  if (!user) return false;
  const projectId = await getProjectIdForUser(user);
  if (!projectId) return false;
  if (user.role === 'admin' || user.role === 'manager') return true;
  return !!(await Project.exists({ _id: projectId, createdBy: user._id }));
}

const requireCanInvite = async (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authorized' });
  if (await userCanInvite(req.user)) return next();
  return res.status(403).json({
    message:
      "Seuls les administrateurs, les managers ou le créateur de l'équipe peuvent envoyer des invitations.",
  });
};

module.exports = { userCanInvite, requireCanInvite };
