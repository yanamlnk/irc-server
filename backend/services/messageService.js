const Message = require('../models/Message');
const Channel = require('../models/Channel');

class MessageService {
  validateMessage(text, sender, recipient, channelId) {
    if (!text?.trim()) {
      throw new Error('Message text cannot be empty');
    }
    if (!sender || !recipient) {
      throw new Error('Sender and recipient are required');
    }

    if (!channelId) {
      throw new Error('Channel ID is required');
    }
  }

  //cherche toutes les msgs relevantes à un utilisateur dans une chaine
  // inclut les msgs du channel et les msgs privés envoyés/reçus
  async getChannelMessages(channelId, userId) {
    try {
      //verifie si l'utilisateur est membre du canal
      const channel = await Channel.findOne({
        _id: channelId,
        members: userId,
      });

      if (!channel) {
        throw new Error('User is not a member of this channel');
      }

      // cherche
      // toutes les msgs du channel (recipientType: 'Channel')
      // msgs privés où l'utilisateur est sender ou recipient
      const messages = await Message.find({
        $or: [
          // Msgs du channel
          {
            recipient: channelId,
            recipientType: 'Channel',
          },
          //msgs privés de cet utilisateur dans cette chaine
          {
            recipientType: 'User',
            channelContext: channelId,
            $or: [{ sender: userId }, { recipient: userId }],
          },
        ],
      })
        .populate('sender', 'name')
        .populate('recipient', 'name')
        .sort({ timestamp: 1 })
        .lean();

      // formatation
      return messages.map(message => ({
        id: message._id,
        text: message.text,
        sender: {
          id: message.sender._id,
          name: message.sender.name,
        },
        isPrivate: message.recipientType === 'User',
        recipient:
          message.recipientType === 'User'
            ? {
                id: message.recipient._id,
                name: message.recipient.name,
              }
            : null,
        timestamp: message.timestamp,
      }));
    } catch (err) {
      console.error('Error getting channel messages:', err);
      throw err;
    }
  }

  // sauve une msg privé dans le contexte d'une chaine
  async saveMessage({ text, sender, recipient, recipientType, channelId }) {
    try {
      this.validateMessage(text, sender, recipient, channelId);

      let isPrivate = recipientType === 'User';

      if (isPrivate) {
        const channel = await Channel.findOne({
          _id: channelId,
          members: { $all: [sender, recipient] },
        });

        //verifie si les deux utilisateurs sont membres du canal
        if (!channel) {
          throw new Error('Both users must be members of the channel');
        } else {
          // vérifie si le sender est membre du channel si c'est un msg pour le channel
          const channel = await Channel.findOne({
            _id: channelId,
            members: sender,
          });

          if (!channel) {
            throw new Error('Sender must be a member of the channel');
          }
        }

        const message = new Message({
          text: text.trim(),
          sender,
          recipient,
          recipientType: 'User',
          channelContext: channelId, // referencie le channel où le msg a été envoyé
        });

        const savedMessage = await message.save();
      }
      return await Message.findById(savedMessage._id)
        .populate('sender', 'name')
        .populate('recipient', 'name')
        .lean();
    } catch (err) {
      console.error('Error saving private message:', err);
      throw err;
    }
  }
}

module.exports = new MessageService();
