const mongoose = require('mongoose');
const Channel = require('../models/Channel');

// return all users' names in a channel
async function getUsersInChannel(channelId) {
  if (!mongoose.Types.ObjectId.isValid(channelId)) {
    throw new Error('Invalid channel ID');
  }

  const channel = await Channel.findById(channelId).populate('users', 'name');
//   if (!channel) {
//     throw new Error('Users not found');
//   }
  return channel.users.map(user => ({
    user_id: user._id,
    name: user.name,
  }));
}

// retuns all channels where ther user is present
async function getChannelsOfUser(userID) {
    if (!mongoose.Types.ObjectId.isValid(userID)) {
        throw new Error('Invalid user ID');
    }

    const channels = await Channel.find({ users: userID}).select('_id name');
    // if (channels.length === 0) {
    //     throw new Error('Channels not found');
    // }
    
    return channels.map(channel => ({
        channel_id: channel._id,
        name: channel.name,
    }));
}

module.exports = {
  getUsersInChannel,
  getChannelsOfUser,
};