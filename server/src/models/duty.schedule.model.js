const mongoose = require('mongoose');

const dutyScheduleSchema = new mongoose.Schema(
  {
    room_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
      index: true,
    },
    week_start: {
      type: Date,
      required: true,
      index: true,
    },
    day_label: {
      type: String,
      required: true,
      trim: true,
      enum: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'],
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    start_hour: {
      type: Number,
      required: true,
      min: 1,
      max: 23,
    },
    end_hour: {
      type: Number,
      required: true,
      min: 2,
      max: 24,
    },
    members: {
      type: [String],
      default: [],
    },
    note: {
      type: String,
      trim: true,
      default: '',
      maxlength: 500,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'duty_schedules',
  }
);

dutyScheduleSchema.index({ room_id: 1, week_start: 1, day_label: 1, start_hour: 1 });

module.exports = mongoose.model('DutySchedule', dutyScheduleSchema);
