const { getProjectIdForUser } = require('../utils/projectScope');

/** Tout membre du workspace peut accéder au back-office (lecture du statut admin). */
const requireBackofficeMember = async (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authorized' });

  const projectId = await getProjectIdForUser(req.user);
  if (!projectId) {
    return res.status(403).json({ message: 'Aucun espace de travail associé.' });
  }
  req.projectId = projectId;
  next();
};

/** Actions réservées aux administrateurs de l'équipe. */
const requireTeamAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authorized' });
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      message: "Vous n'êtes pas administrateur dans cette équipe.",
      code: 'NOT_TEAM_ADMIN',
    });
  }
  next();
};

module.exports = { requireBackofficeMember, requireTeamAdmin };
