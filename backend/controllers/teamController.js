const User = require('../models/User');
const { withOnlineStatus } = require('../utils/presence');

const getActiveTeam = async (req, res) => {
  try {
    const members = await User.find({
      projectId: req.projectId,
      _id: { $ne: req.user._id },
    })
      .select('nom prenom job_role avatar_url is_online lastSeenAt')
      .lean();

    const online = withOnlineStatus(members).filter((m) => m.is_online);
    res.json(online);
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
      .select('nom prenom email role job_role avatar_url is_online lastSeenAt')
      .sort({ lastSeenAt: -1, prenom: 1, nom: 1 })
      .lean();

    const withStatus = withOnlineStatus(members);
    withStatus.sort((a, b) => {
      if (a.is_online !== b.is_online) return a.is_online ? -1 : 1;
      return 0;
    });

    res.json(withStatus);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

module.exports = { getActiveTeam, getTeamMembers };
