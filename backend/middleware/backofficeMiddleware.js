const Project = require('../models/Project');
const { getProjectIdForUser } = require('../utils/projectScope');

/** Accès back-office : admin, manager, ou créateur du workspace de l'utilisateur. */
const requireBackofficeAccess = async (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authorized' });

  const projectId = await getProjectIdForUser(req.user);
  if (!projectId) {
    return res.status(403).json({ message: 'Aucun espace de travail associé.' });
  }
  req.projectId = projectId;

  if (['admin', 'manager'].includes(req.user.role)) return next();
  const isCreator = await Project.exists({ _id: projectId, createdBy: req.user._id });
  if (isCreator) return next();
  return res.status(403).json({ message: 'Forbidden' });
};

module.exports = { requireBackofficeAccess };
