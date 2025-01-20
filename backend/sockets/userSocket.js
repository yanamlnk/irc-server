const { getUserByName, updateUserName } = require('../services/userService');
const User = require('../models/User');
const { getChannelsOfUser } = require('../services/channelService');

function userSocket(socket, io) {
  //choisir un nom d'utilisateur
  socket.on('chooseName', async (name, callback) => {
    try {
      const user = await getUserByName(name);

      await updateUserSocket(user._id, socket.id);

      socket.userId = user._id;
      socket.userName = user.name;

      const channels = await getChannelsOfUser(user._id);
      channels.forEach(channel => socket.join(channel.channel_id));

      callback({ success: true, user: { id: user._id, name: user.name } });
    } catch (err) {
      callback({ success: false, message: err.message });
    }
  });

  socket.on('changeName', async ({ currentName, newName }, callback) => {
    try {
      const updatedUser = await updateUserName(socket.userId, newName);
      socket.userName = newName;

      const userChannels = await getChannelsOfUser(socket.userId);
      userChannels.forEach(channel => {
        io.to(channel.channel_id).emit('userNameChanged', {
          userId: socket.userId,
          oldName: currentName,
          newName: newName,
        });
      });

      callback({ success: true, newName });
    } catch (err) {
      callback({ success: false, message: err.message });
    }
  });

  //lorsque l'utilisateur se deconnecte, nettoie le socket id
  socket.on('disconnect', async () => {
    if (socket.userId) {
      await User.findByIdAndUpdate(socket.userId, { socketId: null });
    }
  });
}

module.exports = userSocket;
