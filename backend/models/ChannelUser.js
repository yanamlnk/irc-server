const mongoose = require('mongoose');

const channelUserSchema = new mongoose.Schema({
  channel: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  nickname: { type: String, required: true },
});

channelUserSchema.index({ channel: 1, user: 1 }, { unique: true });

const ChannelUser = mongoose.model('ChannelUser', channelUserSchema);

module.exports = ChannelUser;
