const Task = require('../models/Task');
const { taskScopeForProject } = require('../utils/projectScope');
const mongoose = require('mongoose');

const getSummary = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Database not connected' });
    }
    const scope = taskScopeForProject(req.projectId);
    const [total, completed, inProgress, toDo] = await Promise.all([
      Task.countDocuments(scope),
      Task.countDocuments({ ...scope, status: 'Completed' }),
      Task.countDocuments({ ...scope, status: 'In Progress' }),
      Task.countDocuments({ ...scope, status: 'To Do' }),
    ]);

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const remainingToday = await Task.countDocuments({
      ...scope,
      due_date: { $gte: start, $lte: end },
      status: { $ne: 'Completed' },
    });

    const completedPercent =
      total > 0 ? Math.round((completed / total) * 1000) / 10 : 0;

    const performanceScore =
      total > 0 ? Math.round((completed / total) * 1000) / 10 : null;

    res.json({
      totalTasks: total,
      completed,
      inProgress,
      toDo,
      completedPercent,
      performanceScore,
      remainingToday,
      trends: {
        total: null,
        inProgress: null,
      },
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const getFocusTask = async (req, res) => {
  try {
    const scope = taskScopeForProject(req.projectId);
    const tasks = await Task.find({
      ...scope,
      status: { $ne: 'Completed' },
    })
      .populate('assigned_users', 'nom prenom avatar_url job_role')
      .lean();

    const weight = { Urgent: 3, High: 2, Normal: 1 };
    tasks.sort((a, b) => {
      const pw = (weight[b.priority] || 0) - (weight[a.priority] || 0);
      if (pw !== 0) return pw;
      const da = a.due_date ? new Date(a.due_date).getTime() : Infinity;
      const db = b.due_date ? new Date(b.due_date).getTime() : Infinity;
      return da - db;
    });

    const focus = tasks[0] || null;
    res.json(focus);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

module.exports = { getSummary, getFocusTask };
