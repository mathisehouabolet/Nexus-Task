const { taskScopeForProject } = require('./projectScope');

/** @deprecated Use taskScopeForProject(projectId) */
const taskScopeForUser = (userId) => ({
  $or: [{ createdBy: userId }, { assigned_users: userId }],
});

module.exports = taskScopeForUser;
module.exports.taskScopeForProject = taskScopeForProject;
