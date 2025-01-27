const messageService = require('../services/messageService');

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
  socket.on('channelMessage', async ({ text, channelId }, callback) => {
    try {
      if (!socket.userName) {
        throw new Error('Choose a name before sending a message');
      }

      const senderInChannel = io.sockets.adapter.rooms.get(channelId)?.has(socket.id);
      if (!senderInChannel) {
        throw new Error('Sender must be a member of the channel');
      }

      const message = await messageService.saveMessage({
        text,
        sender: socket.userName,
        channelId,
      });

      io.to(channelId).emit('newMessage', {
        ...message.toObject(),
        isSent: true,
      });
      callback({ success: true, message: message });
    } catch (err) {
      callback({ success: false, message: err.message });
    }
  });

  //envoyer un message privé
  socket.on('privateMessage', ({ text, to, channelId }, callback) => {
    try {
      if (!socket.userName) {
        throw new Error('You must choose a name');
      }

      const recipientSocket = [...io.sockets.sockets.values()].find(s => s.userName === to);

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

      const message = messageService.createPrivateMessage({
        text,
        sender: socket.userName,
        recipient: to,
        channelId: channelId,
      });

      socket.emit('newMessage', {
        ...message,
        isSent: true,
      });

      if (recipientInChannel) {
        io.to(recipientInChannel.socketId).emit('newMessage', {
          ...message,
          isSent: false,
        });
      }

      callback({ success: true, message });
    } catch (err) {
      console.error('Error in privateMessage:', err);
      callback({ success: false, message: err.message });
    }
  });
}

module.exports = messageSocket;

// l'utilisateur choisit le nom -> socket enregistré
// l'utilisateur rejoint le canal -> charge les messages du canal
// les messages privés sont envoyés dans le contexte du canal actuel
//les changements de nom sont propagés à tous les canaux concernés
