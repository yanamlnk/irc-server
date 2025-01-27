const { createUser, updateUserName } = require('../services/userService');
const User = require('../models/User');
const { getChannelsOfUser } = require('../services/channelService');

function userSocket(socket, io) {
  //choisir un nom d'utilisateur
  socket.on('chooseName', async (name, callback) => {
    try {
      const user = await createUser(name);

      // await updateUserSocket(user._id, socket.id);

      socket.userId = user._id;
      socket.userName = user.name;

      const channels = await getChannelsOfUser(user._id);
      channels.forEach(channel => socket.join(channel.channel_id.toString()));

      callback({ success: true, user: { id: user._id, name: user.name } });
    } catch (err) {
      callback({ success: false, message: err.message });
    }
  });

  socket.on('changeName', async ({ userId, newName, channelId }, callback) => {
    try {
      const updatedUser = await updateUserName(userId, newName, channelId);

      io.to(channelId.toSting()).emit('userChangedName', {
        userId: userId,
        channelId: channelId,
        newName: updatedUser.nickname,
      });

      callback({ success: true, newName });
    } catch (err) {
      callback({ success: false, message: err.message });
    }
  });
}

module.exports = userSocket;
