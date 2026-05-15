const taskScopeForUser = (userId) => ({
  $or: [{ createdBy: userId }, { assigned_users: userId }],
});

module.exports = taskScopeForUser;
