const { getUserByName } = require('../services/userService');
const { saveMessage } = require('../services/messageService');
const { getUsersInChannel } = require('../services/channelService');

function messageSocket(io, socket) {
  //envoyer un message privé
  socket.on('privateMessage', async ({ text, to, channelId }, callback) => {
    try {
      const usersInChannel = await getUsersInChannel(channelId);
      const recipientInChannel = usersInChannel.find(u => u.name === to);

      if (!recipientInChannel) {
        throw new Error('Recipient is not in this channel');
      }

      const message = await messageService.saveMessage({
        text,
        sender: socket.userId,
        recipient: recipientInChannel.user_id,
        recipientType: 'User',
        channelContext: channelId,
      });

      const messageData = {
        ...message,
        isPrivate: true,
        channelId,
      };

      socket.emit('newMessage', {
        ...messageData,
        isSent: true,
      });

      if (recipientInChannel.socketId) {
        io.to(recipientInChannel.socketId).emit('newMessage', {
          ...messageData,
          isSent: false,
        });
      }

      callback({ success: true, message: messageData });
    } catch (err) {
      callback({ success: false, message: err.message });
    }
  });
}

module.exports = messageSocket;
