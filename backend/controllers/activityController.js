const Activity = require('../models/Activity');

const getActivities = async (req, res) => {
  try {
    const list = await Activity.find({ projectId: req.projectId })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('user', 'nom prenom avatar_url')
      .lean();

    res.json(list);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const clearActivities = async (req, res) => {
  try {
    const result = await Activity.deleteMany({ projectId: req.projectId });
    res.json({ deletedCount: result.deletedCount || 0 });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

module.exports = { getActivities, clearActivities };
