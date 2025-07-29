const mongoose = require('mongoose');

const forumBlockSchema = new mongoose.Schema({
  forumId: {
    type: String,
    required: true
  },
  forumOwnerId: {
    type: String,
    required: true
  },
  blockedUserId: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  blockedBy: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: false
  },
  blockedAt: {
    type: Date,
    default: Date.now
  }
});

forumBlockSchema.index({ forumId: 1, blockedUserId: 1 }, { unique: true });

module.exports = mongoose.model('ForumBlock', forumBlockSchema); 