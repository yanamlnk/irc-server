// userService.js
const User = require('../models/User');

async function getUserByName(name) {
  try {
    const user = await User.findOne({ name: name });
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  } catch (err) {
    console.error('Error getting user:', err);
    throw err;
  }
}

async function updateUserName(userId, newName) {
  try {
    const existingUser = await User.findOne({ name: newName });
    if (existingUser) {
      throw new Error('Username already taken');
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        name: newName,
        // updatedAt: new Date()
      },
      { new: true },
    );

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  } catch (err) {
    console.error('Error updating user name:', err);
    throw err;
  }
}

async function updateUserSocket(userId, socketId) {
  try {
    return await User.findByIdAndUpdate(userId, { socketId: socketId }, { new: true });
  } catch (err) {
    console.error('Error updating user socket:', err);
    throw err;
  }
}

async function getUsersInSameChannel(channelId, excludeUserId) {
  try {
    const channel = await channel.findById(channelId).populate('users', 'name socketId');

    return channel.users
      .filter(user => user._id.toString() !== excludeUserId)
      .map(user => ({
        id: user._id,
        name: user.name,
        socketId: user.socketId,
      }));
  } catch (err) {
    console.error('Error getting users in channel:', err);
    throw err;
  }
}

module.exports = { getUserByName, updateUserName, updateUserSocket, getUsersInSameChannel };
