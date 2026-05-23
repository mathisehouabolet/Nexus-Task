const User = require('../models/User');

const getActiveTeam = async (req, res) => {
  try {
    const members = await User.find({
      projectId: req.projectId,
      _id: { $ne: req.user._id },
      is_online: true,
    })
      .select('nom prenom job_role avatar_url is_online')
      .lean();

    res.json(members);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const getTeamMembers = async (req, res) => {
  try {
    const members = await User.find({
      projectId: req.projectId,
      _id: { $ne: req.user._id },
    })
      .select('nom prenom email role job_role avatar_url is_online')
      .sort({ is_online: -1, prenom: 1, nom: 1 })
      .lean();

    res.json(members);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

module.exports = { getActiveTeam, getTeamMembers };
