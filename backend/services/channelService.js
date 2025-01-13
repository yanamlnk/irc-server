const Channel = require('../models/Channel');

// Get all users in a channel
async function getUsersInChannel(channelId) {
  const channel = await Channel.findById(channelId).populate('users', 'name'); // Populate user names
  if (!channel) {
    throw new Error('Channel not found');
  }
  return channel.users.map(user => user.name); // Return list of user names
}

module.exports = {
  getUsersInChannel,
};