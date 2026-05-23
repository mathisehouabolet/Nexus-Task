const mongoose = require('mongoose');
const User = require('../models/User');
const Project = require('../models/Project');

async function resolveProjectIdForUserId(userId) {
  const user = await User.findById(userId).select('projectId').lean();
  if (user?.projectId) return user.projectId;

  const project = await Project.findOne({ members: userId })
    .sort({ createdAt: 1 })
    .select('_id')
    .lean();
  if (!project) return null;

  await User.updateOne({ _id: userId }, { projectId: project._id });
  return project._id;
}

async function ensureUserProject(user) {
  if (!user) return null;
  if (user.projectId) return user;
  const projectId = await resolveProjectIdForUserId(user._id);
  if (projectId) {
    user.projectId = projectId;
  }
  return user;
}

async function getProjectIdForUser(user) {
  if (!user) return null;
  if (user.projectId) return user.projectId;
  return resolveProjectIdForUserId(user._id);
}

function taskScopeForProject(projectId) {
  if (!projectId) {
    return { _id: { $exists: false } };
  }
  return { projectId };
}

async function assertUserInProject(userId, projectId) {
  if (!projectId || !mongoose.Types.ObjectId.isValid(String(userId))) return false;
  const member = await User.findOne({ _id: userId, projectId }).select('_id').lean();
  return !!member;
}

async function filterAssigneesToProject(assigneeIds, projectId) {
  const valid = (Array.isArray(assigneeIds) ? assigneeIds : []).filter((id) =>
    mongoose.Types.ObjectId.isValid(id)
  );
  if (!valid.length || !projectId) return [];
  const members = await User.find({ _id: { $in: valid }, projectId })
    .select('_id')
    .lean();
  return members.map((m) => m._id);
}

module.exports = {
  resolveProjectIdForUserId,
  ensureUserProject,
  getProjectIdForUser,
  taskScopeForProject,
  assertUserInProject,
  filterAssigneesToProject,
};
