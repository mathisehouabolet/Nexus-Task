const { getProjectIdForUser } = require('../utils/projectScope');

const requireWorkspace = async (req, res, next) => {
  const projectId = await getProjectIdForUser(req.user);
  if (!projectId) {
    return res.status(403).json({
      message:
        "Aucun espace de travail associé. Créez une équipe via l'inscription workspace.",
    });
  }
  req.projectId = projectId;
  next();
};

module.exports = { requireWorkspace };
