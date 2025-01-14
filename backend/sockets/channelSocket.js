const { getUsersInChannel, getChannelsOfUser } = require('../services/channelService');

function channelSocket(socket, io) {

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
  
    // Add more channel-related events here
  }

module.exports = channelSocket;
