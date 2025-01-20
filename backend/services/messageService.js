const Message = require('../models/Message');
const Channel = require('../models/Channel');
const mongoose = require('mongoose');

class MessageService {
  validateMessage(text, sender, recipient, channelContext) {
    if (!text?.trim()) {
      throw new Error('Message text cannot be empty');
    }
    if (!sender || !recipient) {
      throw new Error('Sender and recipient are required');
    }

    if (!channelContext) {
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
  async saveMessage({ text, sender, recipient, recipientType, channelContext }) {
    try {
      this.validateMessage(text, sender, recipient, channelContext);

      if (recipientType === 'Channel') {
        const channel = await Channel.findById(recipient);

        if (!channel) {
          throw new Error('Channel not found');
        }

        const senderInChannel = channel.users.includes(sender);
        if (!senderInChannel) {
          throw new Error('Sender must be a member of the channel');
        }
        const message = new Message({
          text: text.trim(),
          sender,
          recipient,
          recipientType: 'Channel',
          channelContext,
        });

        const savedMessage = await message.save();

        return await Message.findById(savedMessage._id).populate('sender', 'name').lean();
      } else {
        let isPrivate = recipientType === 'User';

        if (isPrivate) {
          const senderObjectId = mongoose.Types.ObjectId.createFromHexString(sender);
          const recipientObjectId =
            typeof recipient === 'object'
              ? recipient
              : mongoose.Types.ObjectId.createFromHexString(recipient.toString());
          const channelObjectId = mongoose.Types.ObjectId.createFromHexString(channelContext);

          //d'abord on trouve le canal
          const channel = await Channel.findById(channelObjectId);
          console.log('Found channel:', {
            id: channel?._id,
            name: channel?.name,
            numberOfUsers: channel?.users?.length,
          });

          if (!channel) {
            throw new Error('Channel not found');
          }

          //transforme les utilisateurs en string pour comparer
          const channelUserIds = channel.users.map(id => id.toString());
          console.log('Channel user IDs:', channelUserIds);
          console.log('Checking for users:', {
            sender: senderObjectId.toString(),
            recipient: recipientObjectId.toString(),
          });

          // vérifie si les deux utilisateurs sont dans le channel
          const senderInChannel = channelUserIds.includes(senderObjectId.toString());
          const recipientInChannel = channelUserIds.includes(recipientObjectId.toString());

          console.log('User presence:', {
            senderInChannel,
            recipientInChannel,
          });

          if (!senderInChannel || !recipientInChannel) {
            throw new Error('Both users must be members of the channel');
          }

          const message = new Message({
            text: text.trim(),
            sender: senderObjectId,
            recipient: recipientObjectId,
            recipientType: 'User',
            channelContext: channelObjectId,
          });

          const savedMessage = await message.save();
          console.log('Message saved:', savedMessage);

          return await Message.findById(savedMessage._id)
            .populate('sender', 'name')
            .populate('recipient', 'name')
            .lean();
        }
      }
    } catch (err) {
      console.error('Error saving private message:', err);
      throw err;
    }
  }
}

module.exports = new MessageService();
