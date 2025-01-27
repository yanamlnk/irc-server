const Message = require('../models/Message');
const Channel = require('../models/Channel');

class MessageService {
  validateMessage(text, sender, recipientType, channelId) {
    if (!text?.trim()) {
      throw new Error('Message text cannot be empty');
    }
    if (!sender || !recipientType) {
      throw new Error('Sender and recipient are required');
    }

    if (!channelId) {
      throw new Error('Channel ID is required');
    }
  }

  //cherche toutes les msgs relevantes à un utilisateur dans une chaine
  // inclut les msgs du channel et les msgs privés envoyés/reçus
  async getChannelMessages(channelId, user) {
    try {
      //verifie si le channel existe
      const channel = await Channel.findById(channelId);

      if (!channel) {
        throw new Error('Channel not found');
      }
      //vérifie si l'utilisateur est membres du channel
      if (!channel.users.includes(user)) {
        throw new Error('User is not a member of the channel');
      }

      // cherche
      // toutes les msgs du channel (recipientType: 'Channel')
      const messages = await Message.find({
        // Msgs du channel
        channelId: channelId,
        recipientType: 'Channel',
      })
        .sort({ timestamp: 1 })
        .lean();

      // formatation
      return messages.map(message => ({
        id: message._id,
        text: message.text,
        sender: message.senderName,
        timestamp: message.timestamp,
        channelId: message.channelId,
      }));
    } catch (err) {
      console.error('Error getting channel messages:', err);
      throw err;
    }
  }

  // sauve une msg privé dans le contexte d'une chaine
  async saveMessage({ text, sender, channelId }) {
    try {
      this.validateMessage(text, sender, 'Channel', channelId);

      const message = new Message({
        text: text.trim(),
        sender,
        recipientType: 'Channel',
        channelId,
      });

      return await message.save();
    } catch (err) {
      console.error('Error saving channel message:', err);
      throw err;
    }
  }

  createPrivateMessage({ text, sender, recipientName, channelId }) {
    try {
      this.validateMessage(text, sender, 'Private', channelId);

      return {
        text: text.trim(),
        sender,
        recipientType: 'Private',
        recipientName,
        channelId,
        timestamp: new Date(),
      };
    } catch (err) {
      console.error('Error creating private message:', err);
      throw err;
    }
  }
}

module.exports = new MessageService();
