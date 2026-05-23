/**
 * Associe utilisateurs, tâches et activités à leur projet (équipe).
 * Usage: node scripts/migrate-team-isolation.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Activity = require('../models/Activity');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  let usersUpdated = 0;
  const projects = await Project.find().lean();
  for (const project of projects) {
    for (const memberId of project.members || []) {
      const r = await User.updateOne(
        { _id: memberId, $or: [{ projectId: { $exists: false } }, { projectId: null }] },
        { $set: { projectId: project._id } }
      );
      usersUpdated += r.modifiedCount || 0;
    }
  }

  let tasksUpdated = 0;
  const tasks = await Task.find({
    $or: [{ projectId: { $exists: false } }, { projectId: null }],
  }).select('createdBy');
  for (const task of tasks) {
    const user = await User.findById(task.createdBy).select('projectId').lean();
    if (!user?.projectId) continue;
    await Task.updateOne({ _id: task._id }, { $set: { projectId: user.projectId } });
    tasksUpdated += 1;
  }

  let activitiesUpdated = 0;
  const activities = await Activity.find({
    $or: [{ projectId: { $exists: false } }, { projectId: null }],
  }).select('forUser');
  for (const act of activities) {
    const user = await User.findById(act.forUser).select('projectId').lean();
    if (!user?.projectId) continue;
    await Activity.updateOne({ _id: act._id }, { $set: { projectId: user.projectId } });
    activitiesUpdated += 1;
  }

  console.log('Migration terminée:', {
    usersUpdated,
    tasksUpdated,
    activitiesUpdated,
  });
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
