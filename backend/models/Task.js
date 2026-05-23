const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['To Do', 'In Progress', 'Completed'],
      default: 'To Do',
    },
    priority: {
      type: String,
      enum: ['Urgent', 'High', 'Normal'],
      default: 'Normal',
    },
    due_date: { type: Date, default: null },
    assigned_users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    project_name: { type: String, default: '' },
    department: { type: String, default: '' },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);
