const User = require('../models/User');

async function getUserByName(name) {
  try {
    const user = await User.findOne({ name: name });
    return user;
  } catch (err) {
    console.error('Error getting user', err);
    throw err;
  }
}

async function updateUserName(userId, newName) {
  try {
    const user = await User.findByIdAndUpdate(userId, { name: newName }, { new: true });
    return user;
  } catch (err) {
    console.error('Error updating user name', err);
    throw err;
  }
}

module.exports = { getUserByName, updateUserName };
