const User = require('../models/User');
const Project = require('../models/Project');

async function addInvitedUserToInviterProject(inviterId, userId) {
  const inviter = await User.findById(inviterId).select('projectId').lean();
  let projectId = inviter?.projectId;

  if (!projectId) {
    const project = await Project.findOne({ createdBy: inviterId })
      .sort({ createdAt: 1 })
      .select('_id')
      .lean();
    projectId = project?._id;
    if (projectId) {
      await User.updateOne({ _id: inviterId }, { projectId });
    }
  }

  if (!projectId) return;

  await Project.updateOne({ _id: projectId }, { $addToSet: { members: userId } });
  await User.updateOne({ _id: userId }, { projectId });
}

module.exports = {
  addInvitedUserToInviterProject,
  addInvitedUserToInviterProjects: addInvitedUserToInviterProject,
};
