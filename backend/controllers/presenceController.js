const User = require('../models/User');

const ping = async (req, res) => {
  try {
    const now = new Date();
    await User.updateOne(
      { _id: req.user._id },
      { $set: { is_online: true, lastSeenAt: now } }
    );
    res.json({ ok: true, lastSeenAt: now });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const goOffline = async (req, res) => {
  try {
    await User.updateOne(
      { _id: req.user._id },
      { $set: { is_online: false, lastSeenAt: new Date() } }
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

module.exports = { ping, goOffline };
