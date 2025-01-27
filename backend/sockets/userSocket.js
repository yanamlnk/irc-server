const { createUser, updateUserName, getNickname } = require('../services/userService');
const { getChannelId } = require('../services/channelService');

function userSocket(socket, io) {
  //choisir un nom d'utilisateur
  socket.on('chooseName', async (name, callback) => {
    try {
      const user = await createUser(name);

      socket.userId = user._id;
      socket.userName = user.name;

      const channelId = await getChannelId('#general');

      socket.join(channelId.toString());

      io.to(channelId).emit('userJoinedChannel', {
        userId: user._id,
        channelId: channelId,
        userName: user.name,
      });

      callback({ success: true, user: { id: user._id, name: user.name } });
    } catch (err) {
      callback({ success: false, message: err.message });
    }
  });

  socket.on('changeName', async ({ userId, newName, channelId }, callback) => {
    try {
      const updatedUser = await updateUserName(userId, newName, channelId);

      io.to(channelId.toString()).emit('userChangedName', {
        userId: userId,
        channelId: channelId,
        newName: updatedUser.nickname,
      });
      
      callback({ success: true, newName });
    } catch (err) {
      callback({ success: false, message: err.message });
    }
  });

  socket.on('getNickname', async ({ userId, channelId }, callback) => {
    try {
      const nickname = await getNickname(userId, channelId);

      callback({ success: true, nickname });
    } catch (err) {
      callback({ success: false, message: err.message });
    }
  });
}

module.exports = userSocket;
