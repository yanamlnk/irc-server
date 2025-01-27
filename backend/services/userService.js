// userService.js
const User = require('../models/User');
const { joinChannel } = require('./channelService');
const ChannelUser = require('../models/ChannelUser');

async function createUser(name) {
  try {
    const user = new User({ name: name });
    await user.save();

    const generalChannel = '#general';
    await joinChannel(user._id, generalChannel);

    return user;
  } catch (err) {
    console.error('Error handling user:', err);
    throw err;
  }
}

async function updateUserName(userId, newName, channelId) {
  try {
    const existingChannelUser = await ChannelUser.findOne({
      channel: channelId,
      user: userId,
    });

    if (!existingChannelUser) {
      throw new Error('User not found in channel');
    }

    if (existingChannelUser.nickname === newName) {
      return existingChannelUser;
    }

    let isNicknameTaken = true;
    let nickname = newName;

    while (isNicknameTaken) {
      const existingUser = await ChannelUser.findOne({
        channel: channelId,
        nickname: newName,
      });

      if (existingUser) {
        nickname = `${newName}${Math.floor(1000 + Math.random() * 9000)}`;
      } else {
        isNicknameTaken = false;
      }
    }

    existingChannelUser.nickname = nickname;
    await existingChannelUser.save();
    
    return existingChannelUser;
  } catch (err) {
    console.error('Error updating user name:', err);
    throw err;
  }
}

const getNickname = async (userId, channelId) => {
  try {
    const channelUser = await ChannelUser.findOne({
      user: userId,
      channel: channelId,
    });

    if (!channelUser) {
      throw new Error('ChannelUser not found');
    }

    return channelUser.nickname;
  } catch (error) {
    console.error('Error retrieving nickname:', error);
    throw error;
  }
};

// async function updateUserSocket(userId, socketId) {
//   try {
//     return await User.findByIdAndUpdate(userId, { socketId: socketId }, { new: true });
//   } catch (err) {
//     console.error('Error updating user socket:', err);
//     throw err;
//   }
// }

// async function getUsersInSameChannel(channelId, excludeUserId) {
//   try {
//     const channel = await channel.findById(channelId).populate('users', 'name socketId');

//     return channel.users
//       .filter(user => user._id.toString() !== excludeUserId)
//       .map(user => ({
//         id: user._id,
//         name: user.name,
//         socketId: user.socketId,
//       }));
//   } catch (err) {
//     console.error('Error getting users in channel:', err);
//     throw err;
//   }
// }

module.exports = { createUser, updateUserName, getNickname };
