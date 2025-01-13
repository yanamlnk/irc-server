const { getUsersInChannel } = require('../services/channelService');

function channelSocket(io) {
  io.on('connection', socket => {
    console.log('A user connected to the channel socket:', socket.id);

    // Event to list all users in a channel
    socket.on('listUsersInChannel', async (channelId, callback) => {
      try {
        const users = await getUsersInChannel(channelId);
        callback({ success: true, users });
      } catch (err) {
        console.error(err);
        callback({ success: false, message: err.message });
      }
    });

    socket.on('disconnect', () => {
      console.log('A user disconnected from the channel socket:', socket.id);
    });
  });
}

module.exports = channelSocket;
