const {
  getUsersInChannel,
  getChannelsOfUser,
  joinChannel,
  createChannel,
  quitChannel,
  renameChannel,
  deleteChannel,
  getChannels,
  getChannelId,
} = require('../services/channelService');

function channelSocket(socket, io) {

  //get channel id by name. returns channel id
  socket.on('getChannelId', async (channelName, callback) => {
    try {
      const channelId = await getChannelId(channelName);
  
      callback({ success: true, channelId });
    } catch (err) {
      console.error(err);
      callback({ success: false, message: err.message });
    }
  });

  //list all channels where user is present. needs userID. returns list of channelIDs ('channel_id') and names of channels ('name')
  socket.on('listChannelsOfUser', async (userID, callback) => {
    try {
      const channels = await getChannelsOfUser(userID);
      callback({ success: true, channels });
    } catch (err) {
      console.error(err);
      callback({ success: false, message: err.message });
    }
  });

  // list all users in a channel. Needs channelID. Returns list userIDs ('user_id') and names ('name')
  socket.on('listUsersInChannel', async (channelId, callback) => {
    try {
      const users = await getUsersInChannel(channelId);
      callback({ success: true, users });
    } catch (err) {
      console.error(err);
      callback({ success: false, message: err.message });
    }
  });

  // Add user to the channel. returns the updated channel with new list of users.
  socket.on('joinChannel', async ({ userId, channelName }, callback) => {
      try {
        const updatedChannel = await joinChannel(userId, channelName);
        const channelId = updatedChannel.channel_id.toString();
        const userNickname = await ChannelUser.findOne({
          channel: updatedChannel.channel_id,
          user: userId,
        }).select('nickname');

      if (!userNickname) {
        throw new Error('Could not find user nickname');
      } 

      socket.join(channelId);
      io.to(channelId).emit('userJoinedChannel', {
        userId: userId,
        channelId: channelId,
        userName: userNickname.nickname,
      });

      callback({ success: true, channel: updatedChannel });
    } catch (err) {
      console.error(err);
      callback({ success: false, message: err.message });
    }
  });

  //create channel with the given name. Returns the new channel. Automatically add a user who created a channel to the channel
  socket.on('createChannel', async ({ userId, name }, callback) => {
    try {
      const newChannel = await createChannel(userId, name);
      socket.join(newChannel.channel_id.toString());
      callback({ success: true, channel: newChannel });
    } catch (err) {
      console.error(err);
      callback({ success: false, message: err.message });
    }
  });

  //quit channel. takes userid and channel id. returns new updated channel info
  socket.on('quitChannel', async ({ userId, channelId }, callback) => {
    try {
      const updatedChannel = await quitChannel(userId, channelId);
      socket.leave(channelId.toString());

      io.to(channelId).emit('userLeftChannel', {
        userId,
        channelId,
        userName: updatedChannel.deletedUserNickname,
      });

      callback({ success: true, channel: updatedChannel });
    } catch (err) {
      console.error(err);
      callback({ success: false, message: err.message });
    }
  });

  //rename channel. takes channel id and new name. returns updated channel info
  socket.on('renameChannel', async ({ channelId, newName }, callback) => {
    try {
      const updatedChannel = await renameChannel(channelId, newName);

      io.to(channelId).emit('channelRenamed', { channel: updatedChannel });

      callback({ success: true, channel: updatedChannel });
    } catch (err) {
      console.error(err);
      callback({ success: false, message: err.message });
    }
  });

  // delete channel. Takes channel id and return channel id and name that was deleted
  socket.on('deleteChannel', async (channelId, callback) => {
    try {
      const result = await deleteChannel(channelId);

      io.to(channelId).emit('channelDeleted', { channelId: result.channel_id });
      io.in(channelId).socketsLeave(channelId.toString());

      callback({ success: true, channel: result });
    } catch (err) {
      console.error(err);
      callback({ success: false, message: err.message });
    }
  });

  //list all channels. is string is specified, list channels that include the string provided.
  socket.on('listChannels', async (searchString, callback) => {
    try {
      const channels = await getChannels(searchString);
      callback({ success: true, channels });
    } catch (err) {
      console.error(err);
      callback({ success: false, message: err.message });
    }
  });
}

module.exports = channelSocket;
