const { createUser, updateUserName, getNickname } = require('../services/userService');
const { getChannelId } = require('../services/channelService');

function userSocket(socket, io) {
  //choisir un nom d'utilisateur
  socket.on('chooseName', async (name, callback) => {
    try {
      const user = await createUser(name);

      socket.userId = user._id;
      socket.userName = user.name;

      const channel = await getChannelId('#general');

      socket.join(channel.channel_id.toString());

      const members = io.sockets.adapter.rooms.get(channel.channel_id.toString());
      console.log(`Members in chooseName : "${channel.channel_id.toString()}":`, members);

      io.to(channel.channel_id.toString()).emit('userJoinedChannel', {
        userId: user._id,
        channelId: channel.channel_id,
        channelName: channel.name,
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

      socket.to(channelId.toString()).emit('userChangedName', {
        userId: userId,
        channelId: channelId,
        newName: updatedUser.nickname,
      });
      
      callback({ success: true, newName: updatedUser.nickname });
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
