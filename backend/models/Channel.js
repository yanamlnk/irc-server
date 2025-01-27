const mongoose = require('mongoose');
const ChannelUser = require('../models/ChannelUser');

const channelSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

channelSchema.virtual('channelUsers', {
  ref: 'ChannelUser',
  localField: '_id',
  foreignField: 'channel',
});

const Channel = mongoose.model('Channel', channelSchema);

module.exports = Channel;