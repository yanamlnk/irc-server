const messageService = require('../services/messageService');
const { getUsersInChannel } = require('../services/channelService');

function messageSocket(socket, io) {
  console.log('MessageSocket initialized for socket:', socket.id);

  socket.on('authenticate', data => {
    console.log('Raw authentication data received:', data);
    console.log('Type of data:', typeof data);

    try {
      //juste pour tester avec postman
      let parsedData = typeof data === 'string' ? JSON.parse(data) : data;
      console.log('Parsed data:', parsedData);

      let userId;
      if (Array.isArray(parsedData)) {
        userId = parsedData[1]?.userId;
      } else if (typeof parsedData === 'object') {
        userId = parsedData.data?.userId || parsedData.userId;
      }

      console.log('Final extracted userId:', userId);

      if (!userId) {
        console.log('No userId found in data');
        return;
      }

      socket.userId = userId;
      console.log('Authentication successful for userId:', socket.userId);
    } catch (err) {
      console.error('Error parsing authentication data:', err);
    }
  });

  //envoyer un message privé
  socket.on('privateMessage', async data => {
    console.log('Received private message:', data);
    try {
      const { text, to, channelId } = data;
      console.log('Message details:', { text, to, channelId });

      if (!socket.userId) {
        console.log('User not authenticated');
        throw new Error('User not authenticated');
      }

      const usersInChannel = await getUsersInChannel(channelId);
      console.log('All users in channel:', usersInChannel);
      const recipientInChannel = usersInChannel.find(u => u.name === to);
      console.log('Found recipient:', recipientInChannel);

      if (!recipientInChannel) {
        throw new Error('Recipient is not in this channel');
      }

      console.log('Attempting to save message with:', {
        sender: socket.userId,
        recipient: recipientInChannel.user_id,
        channelId,
      });

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

      if (recipientInChannel) {
        io.to(recipientInChannel.socketId).emit('newMessage', {
          ...messageData,
          isSent: false,
        });
      }

      socket.emit('privateMessageResponse', { success: true, message: messageData });
    } catch (err) {
      console.error('Error in privateMessage:', err);
      socket.emit('privateMessageResponse', { success: false, message: err.message });
    }
  });
}

module.exports = messageSocket;

// l'utilisateur choisit le nom -> socket enregistré
// l'utilisateur rejoint le canal -> charge les messages du canal
// les messages privés sont envoyés dans le contexte du canal actuel
//les changements de nom sont propagés à tous les canaux concernés
