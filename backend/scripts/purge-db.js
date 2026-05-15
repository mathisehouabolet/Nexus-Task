require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
let Project;

async function main() {
  await connectDB();
  try {
    // Optional: project model may not exist in older DBs.
    Project = require('../models/Project');
  } catch {
    Project = null;
  }

  const users = await User.deleteMany({});
  const tasks = await Task.deleteMany({});
  const activities = await Activity.deleteMany({});
  const projects = Project ? await Project.deleteMany({}) : { deletedCount: 0 };

  console.log(
    JSON.stringify(
      {
        deleted: {
          users: users.deletedCount || 0,
          tasks: tasks.deletedCount || 0,
          activities: activities.deletedCount || 0,
          projects: projects.deletedCount || 0,
        },
      },
      null,
      2
    )
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  mongoose.connection.close().catch(() => {});
  process.exit(1);
});

