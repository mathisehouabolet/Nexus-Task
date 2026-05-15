const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    forUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action_type: {
      type: String,
      enum: ['updated', 'commented', 'reported', 'created', 'completed'],
      required: true,
    },
    target_item_name: { type: String, required: true, trim: true },
    department: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Activity', activitySchema);
