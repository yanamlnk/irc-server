// userService.js
const User = require('../models/User');
const { joinChannel } = require('./channelService');
const ChannelUser = require('../models/ChannelUser');

async function createUser(name) {
  try {
    nameIsTaken = true;
    let newName = name;
    while (nameIsTaken) {
      const existingUser = await User.findOne({ name: newName });
      if (existingUser) {
        newName = `${name}${Math.floor(1000 + Math.random() * 9000)}`;
      } else {
        nameIsTaken = false;
      }
    }
    
    const user = new User({ name: newName });
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
    let newNickname = newName;

    while (isNicknameTaken) {
      const existingUser = await ChannelUser.findOne({
        channel: channelId,
        nickname: newNickname,
      });

      if (existingUser) {
        newNickname = `${newName}${Math.floor(1000 + Math.random() * 9000)}`;
      } else {
        isNicknameTaken = false;
      }
    }

    const updatedChannelUser = await ChannelUser.findOneAndUpdate(
      { channel: channelId, user: userId },
      { nickname: newNickname },
      { new: true }
    );
    
    return updatedChannelUser;
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

module.exports = { createUser, updateUserName, getNickname };
