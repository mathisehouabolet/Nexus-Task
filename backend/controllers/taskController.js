const mongoose = require('mongoose');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const { taskScopeForProject, filterAssigneesToProject } = require('../utils/projectScope');

const ALLOWED_STATUS = ['To Do', 'In Progress', 'Completed'];
const ALLOWED_PRIORITY = ['Urgent', 'High', 'Normal'];

function parseDueDate(value) {
  if (value == null || value === '') return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

const logActivity = async ({
  userId,
  forUser,
  projectId,
  action_type,
  target_item_name,
  department,
}) => {
  await Activity.create({
    user: userId,
    forUser,
    projectId,
    action_type,
    target_item_name,
    department: department || '',
  });
};

const logActivityForUsers = async ({
  userId,
  forUsers,
  projectId,
  action_type,
  target_item_name,
  department,
}) => {
  const ids = (Array.isArray(forUsers) ? forUsers : [])
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => String(id));
  const uniq = [...new Set(ids)];
  if (!uniq.length) return;
  await Activity.insertMany(
    uniq.map((uid) => ({
      user: userId,
      forUser: uid,
      projectId,
      action_type,
      target_item_name,
      department: department || '',
    }))
  );
};

const createTask = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        message: 'Base de données indisponible. Vérifiez MongoDB et MONGODB_URI.',
      });
    }

    const {
      title,
      description,
      status,
      priority,
      due_date,
      project_name,
      assigned_users,
      department,
    } = req.body;

    if (!title || typeof title !== 'string') {
      return res.status(400).json({ message: 'Title is required' });
    }

    const st = status || 'To Do';
    const pr = priority || 'Normal';
    if (!ALLOWED_STATUS.includes(st)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    if (!ALLOWED_PRIORITY.includes(pr)) {
      return res.status(400).json({ message: 'Invalid priority' });
    }

    const assignees = await filterAssigneesToProject(assigned_users, req.projectId);

    const dept = typeof department === 'string' ? department.trim() : '';

    const task = await Task.create({
      title: title.trim(),
      description: (description || '').trim(),
      status: st,
      priority: pr,
      due_date: parseDueDate(due_date),
      project_name: (project_name || '').trim(),
      department: dept,
      assigned_users: assignees,
      createdBy: req.user._id,
      projectId: req.projectId,
    });

    try {
      await logActivity({
        userId: req.user._id,
        forUser: req.user._id,
        projectId: req.projectId,
        action_type: 'created',
        target_item_name: task.title,
        department: dept,
      });
    } catch (actErr) {
      console.error('Activity log failed (task still saved):', actErr.message);
    }

    const populated = await Task.findById(task._id).populate(
      'assigned_users',
      'nom prenom avatar_url'
    );

    res.status(201).json(populated);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const scope = taskScopeForProject(req.projectId);
    const task = await Task.findOne({ _id: req.params.id, ...scope });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const prevStatus = task.status;
    const prevAssignees = (task.assigned_users || []).map((id) => String(id));

    if (req.body.title != null) task.title = String(req.body.title).trim();
    if (req.body.description != null) task.description = String(req.body.description);
    if (req.body.status != null) {
      if (!ALLOWED_STATUS.includes(req.body.status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      task.status = req.body.status;
    }
    if (req.body.priority != null) {
      if (!ALLOWED_PRIORITY.includes(req.body.priority)) {
        return res.status(400).json({ message: 'Invalid priority' });
      }
      task.priority = req.body.priority;
    }
    if (req.body.project_name != null) task.project_name = String(req.body.project_name);
    if (req.body.department != null) {
      task.department = String(req.body.department).trim();
    }
    if (req.body.due_date !== undefined) {
      task.due_date = parseDueDate(req.body.due_date);
    }
    if (Array.isArray(req.body.assigned_users)) {
      task.assigned_users = await filterAssigneesToProject(
        req.body.assigned_users,
        req.projectId
      );
    }

    await task.save();

    if (Array.isArray(req.body.assigned_users)) {
      const nextAssignees = (task.assigned_users || []).map((id) => String(id));
      const changed =
        prevAssignees.length !== nextAssignees.length ||
        prevAssignees.some((id) => !nextAssignees.includes(id));
      if (changed) {
        const dept = req.body.department || task.project_name || task.department || '';
        await logActivityForUsers({
          userId: req.user._id,
          forUsers: nextAssignees,
          projectId: req.projectId,
          action_type: 'updated',
          target_item_name: task.title,
          department: dept,
        });
      }
    }

    if (req.body.status != null && req.body.status !== prevStatus) {
      const dept = req.body.department || task.project_name || '';
      if (req.body.status === 'Completed') {
        await logActivity({
          userId: req.user._id,
          forUser: req.user._id,
          projectId: req.projectId,
          action_type: 'completed',
          target_item_name: task.title,
          department: dept,
        });
        await logActivityForUsers({
          userId: req.user._id,
          forUsers: task.assigned_users || [],
          projectId: req.projectId,
          action_type: 'completed',
          target_item_name: task.title,
          department: dept,
        });
      } else {
        await logActivity({
          userId: req.user._id,
          forUser: req.user._id,
          projectId: req.projectId,
          action_type: 'updated',
          target_item_name: task.title,
          department: dept,
        });
        await logActivityForUsers({
          userId: req.user._id,
          forUsers: task.assigned_users || [],
          projectId: req.projectId,
          action_type: 'updated',
          target_item_name: task.title,
          department: dept,
        });
      }
    }

    const populated = await Task.findById(task._id).populate(
      'assigned_users',
      'nom prenom avatar_url'
    );

    res.json(populated);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const listTasks = async (req, res) => {
  try {
    const scope = taskScopeForProject(req.projectId);
    const tasks = await Task.find(scope)
      .sort({ updatedAt: -1 })
      .populate('assigned_users', 'nom prenom avatar_url')
      .lean();
    res.json(tasks);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const scope = taskScopeForProject(req.projectId);
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      ...scope,
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ message: 'Task removed', _id: task._id });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

module.exports = { createTask, updateTask, listTasks, deleteTask };
