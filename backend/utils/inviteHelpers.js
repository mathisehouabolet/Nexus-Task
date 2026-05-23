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

function formatInviteEmailError(emailResult) {
  if (!emailResult || emailResult.ok) return null;
  const msg = emailResult.error?.message || '';
  if (msg.includes('only send testing emails')) {
    return (
      "Pour inviter n'importe quelle adresse, vérifiez un domaine sur Resend et définissez RESEND_FROM dans backend/.env (ex. Nexus Task <invitations@votredomaine.com>)."
    );
  }
  if (emailResult.reason === 'missing_api_key') {
    return 'Clé Resend manquante : ajoutez RESEND_API_KEY dans backend/.env.';
  }
  return msg || "L'email d'invitation n'a pas pu être envoyé.";
}

module.exports = {
  addInvitedUserToInviterProject,
  addInvitedUserToInviterProjects: addInvitedUserToInviterProject,
  formatInviteEmailError,
};
