const messageService = require('../services/messageService');
const { getUsersInChannel, getChannelsOfUser } = require('../services/channelService');

function messageSocket(socket, io) {
  console.log('MessageSocket initialized for socket:', socket.id);

  socket.on('getChannelMessages', async ({ channelId }, callback) => {
    try {
      const messages = await messageService.getChannelMessages(channelId);
      callback({ success: true, messages });
    } catch (err) {
      console.error('Error fetching channel messages:', err);
      callback({ success: false, message: err.message });
    }
  });
  //envoyer un message au channel
  socket.on('channelMessage', async ({ text, channelId, senderMessage }, callback) => {
    try {
      if (!senderMessage) {
        throw new Error('Choose a name before sending a message');
      }

      const senderInChannel = io.sockets.adapter.rooms.get(channelId)?.has(socket.id);
      if (!senderInChannel) {
        throw new Error('Sender must be a member of the channel');
      }

      const message = await messageService.saveMessage({
        text,
        sender: senderMessage,
        channelId,
      });

      const members = io.sockets.adapter.rooms.get(channelId.toString());
      console.log(`Members in room for message : "${channelId.toString()}":`, members);

      socket.to(channelId.toString()).emit('newMessage', {
        ...message.toObject(),
        isSent: true,
      });
      callback({ success: true, message: message });
    } catch (err) {
      callback({ success: false, message: err.message });
    }
  });

  //envoyer un message privé
  socket.on(
    'privateMessage',
    async ({ text, recipientName, channelId, senderMessage }, callback) => {
      try {
        if (!senderMessage) {
          throw new Error('You must choose a name');
        }

        if (!text || !recipientName) {
          throw new Error('Message and recipient are required');
        }

        const recipientSocket = [...io.sockets.sockets.values()].find(
          s => s.userName === recipientName,
          console.log('recipientName:', recipientName),
        );

        if (!recipientSocket) {
          throw new Error('Recipient is not online');
        }

        //fonctionnalité native de socket.io pour vérifier si les deux utilisateurs sont dans le même canal
        const channelRoom = io.sockets.adapter.rooms.get(channelId);
        const senderInChannel = channelRoom?.has(socket.id);
        const recipientInChannel = channelRoom?.has(recipientSocket.id);

        if (!senderInChannel || !recipientInChannel) {
          throw new Error('Both users must be in the channel to exchange private messages');
        }

        console.log('Values before createPrivateMessage:', {
          text,
          senderMessage,
          recipientName,
          channelId,
        });
        const message = messageService.createPrivateMessage({
          text,
          sender: senderMessage,
          recipientName: recipientName,
          channelId,
        });
        console.log(`Members in private room: ${channelId}`, channelRoom);
        socket.to(recipientSocket.id.toString()).emit('newPrivateMessage', {
          ...message,
          isSent: true,
        });

        // io.emit('newPrivateMessage', {
        //   ...message,
        //   isSent: false,
        // });

        callback({ success: true, message });
      } catch (err) {
        console.error('Error in privateMessage:', err);
        callback({ success: false, message: err.message });
      }
    },
  );
}

module.exports = messageSocket;

// l'utilisateur choisit le nom -> socket enregistré
// l'utilisateur rejoint le canal -> charge les messages du canal
// les messages privés sont envoyés dans le contexte du canal actuel
//les changements de nom sont propagés à tous les canaux concernés
