const mongoose = require('mongoose');
const crypto = require('crypto');
const User = require('../models/User');
const Task = require('../models/Task');
const Activity = require('../models/Activity');

function generateTempPassword() {
  return crypto.randomBytes(12).toString('hex');
}

const listMembers = async (req, res) => {
  try {
    const list = await User.find({ _id: { $ne: req.user._id } })
      .select('nom prenom email role job_role avatar_url is_online createdAt')
      .sort({ is_online: -1, prenom: 1, nom: 1 })
      .lean();
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const inviteMember = async (req, res) => {
  try {
    const { nom, prenom, email, role, job_role } = req.body || {};
    if (!nom || !prenom || !email) {
      return res.status(400).json({ message: 'nom, prenom, email are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const exists = await User.findOne({ email: normalizedEmail }).lean();
    if (exists) return res.status(400).json({ message: 'User already exists' });

    const tempPassword = generateTempPassword();
    const user = await User.create({
      nom: String(nom).trim(),
      prenom: String(prenom).trim(),
      email: normalizedEmail,
      password: tempPassword,
      role: role || 'user',
      job_role: String(job_role || '').trim(),
      is_online: false,
    });

    res.status(201).json({
      _id: user._id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      role: user.role,
      avatar_url: user.avatar_url || '',
      job_role: user.job_role || '',
      is_online: user.is_online,
      tempPassword,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const deleteMember = async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    if (String(req.user._id) === String(id)) {
      return res.status(400).json({ message: 'Cannot delete yourself' });
    }

    const user = await User.findById(id).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    await Task.updateMany({ assigned_users: id }, { $pull: { assigned_users: id } });
    await Activity.deleteMany({ forUser: id });
    await User.deleteOne({ _id: id });

    res.json({ message: 'User removed', _id: id });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const memberHistory = async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    const list = await Activity.find({ forUser: id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('user', 'nom prenom avatar_url')
      .lean();
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const projectProgress = async (req, res) => {
  try {
    const project = String(req.query.project || '').trim();
    if (!project) return res.status(400).json({ message: 'project is required' });

    const tasks = await Task.find({ project_name: project })
      .select('status assigned_users')
      .lean();

    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'Completed').length;
    const totalProgress = total ? Math.round((completed / total) * 100) : 0;

    const memberIds = new Set();
    for (const t of tasks) {
      for (const u of t.assigned_users || []) memberIds.add(String(u));
    }

    const members = await User.find({ _id: { $in: [...memberIds] } })
      .select('nom prenom email role job_role avatar_url is_online')
      .lean();

    const perMember = members
      .map((m) => {
        const assigned = tasks.filter((t) =>
          (t.assigned_users || []).some((u) => String(u) === String(m._id))
        );
        const memberTotal = assigned.length;
        const memberDone = assigned.filter((t) => t.status === 'Completed').length;
        const progress = memberTotal ? Math.round((memberDone / memberTotal) * 100) : 0;
        return {
          member: m,
          totalTasks: memberTotal,
          completedTasks: memberDone,
          progress,
        };
      })
      .sort((a, b) => b.progress - a.progress);

    res.json({
      project,
      totalTasks: total,
      completedTasks: completed,
      totalProgress,
      perMember,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

module.exports = {
  listMembers,
  inviteMember,
  deleteMember,
  memberHistory,
  projectProgress,
};
