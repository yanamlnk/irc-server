const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Message = require('../../models/Message');
const Channel = require('../../models/Channel');
const User = require('../../models/User');
const messageService = require('../../services/messageService');

describe('Message Service Test', () => {
    let mongoServer;

    let user1, user2, channel;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

        // Create mock users
        user1 = new User({ name: 'user1' });
        user2 = new User({ name: 'user2' });
        await user1.save();
        await user2.save();

        // Create a mock channel with users
        channel = new Channel({ name: 'testChannel', users: [user1._id, user2._id] });
        await channel.save();
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    afterEach(async () => {
        // Cleanup the collections to avoid duplicate keys
        await Message.deleteMany({});
        await Channel.deleteMany({});
    });

    it('should throw error if message text is empty', () => {
        expect(() => {
            messageService.validateMessage('', user1._id, user2._id, channel._id);
        }).toThrow('Message text cannot be empty');
    });

    it('should throw error if sender or recipient is missing', () => {
        expect(() => {
            messageService.validateMessage('Hello', null, user2._id, channel._id);
        }).toThrow('Sender and recipient are required');

        expect(() => {
            messageService.validateMessage('Hello', user1._id, null, channel._id);
        }).toThrow('Sender and recipient are required');
    });

    it('should throw error if channelContext is missing', () => {
        expect(() => {
            messageService.validateMessage('Hello', user1._id, user2._id, null);
        }).toThrow('Channel ID is required');
    });

    it('should save and return a message in a channel', async () => {
        const messageData = {
            text: 'Hello, channel!',
            sender: user1._id, // Correctly passing ObjectId
            recipient: channel._id, // Correctly passing ObjectId for Channel
            recipientType: 'Channel',
            channelContext: channel._id // Correctly passing ObjectId
        };

        const savedMessage = await messageService.saveMessage(messageData);

        expect(savedMessage.text).toBe('Hello, channel!');
        expect(savedMessage.sender.toString()).toBe(user1._id.toString()); // Ensuring ObjectId comparison
        expect(savedMessage.recipientType).toBe('Channel');
        expect(savedMessage.channelContext.toString()).toBe(channel._id.toString());
    });

    it('should throw error if user is not a member of the channel while saving a channel message', async () => {
        // Create another channel without user1
        const anotherChannel = new Channel({ name: 'anotherChannel', users: [user2._id] });
        await anotherChannel.save();

        const messageData = {
            text: 'Message to another channel',
            sender: user1._id, // Correct ObjectId
            recipient: anotherChannel._id, // Correct ObjectId for Channel
            recipientType: 'Channel',
            channelContext: anotherChannel._id // Correct ObjectId
        };

        await expect(messageService.saveMessage(messageData)).rejects.toThrow('Sender must be a member of the channel');
    });

    it('should save and return a private message between users in a channel', async () => {
        const messageData = {
            text: 'Hello, user2!',
            sender: user1._id, // Correct ObjectId
            recipient: user2._id, // Correct ObjectId for User
            recipientType: 'User',
            channelContext: channel._id // Correct ObjectId
        };

        const savedMessage = await messageService.saveMessage(messageData);

        expect(savedMessage.text).toBe('Hello, user2!');
        expect(savedMessage.sender.toString()).toBe(user1._id.toString());
        expect(savedMessage.recipient.toString()).toBe(user2._id.toString());
        expect(savedMessage.recipientType).toBe('User');
        expect(savedMessage.channelContext.toString()).toBe(channel._id.toString());
    });

    it('should throw error if a user is not in the channel for private messages', async () => {
        // Create another user and add them to the channel
        const user3 = new User({ name: 'user3' });
        await user3.save();

        const messageData = {
            text: 'Private message to user2 from user3',
            sender: user3._id, // Correct ObjectId
            recipient: user2._id, // Correct ObjectId
            recipientType: 'User',
            channelContext: channel._id // Correct ObjectId
        };

        // user3 is not in the channel, should throw error
        await expect(messageService.saveMessage(messageData)).rejects.toThrow('Both users must be members of the channel');
    });

    it('should fetch messages from a channel for a user', async () => {
        const messageData1 = {
            text: 'Hello, channel!',
            sender: user1._id,
            recipient: channel._id,
            recipientType: 'Channel',
            channelContext: channel._id
        };
        const messageData2 = {
            text: 'Hello, user1!',
            sender: user2._id,
            recipient: user1._id,
            recipientType: 'User',
            channelContext: channel._id
        };

        // Save both messages
        await messageService.saveMessage(messageData1);
        await messageService.saveMessage(messageData2);

        // Fetch messages for user1
        const messages = await messageService.getChannelMessages(channel._id, user1._id);

        expect(messages.length).toBe(2);
        expect(messages[0].text).toBe('Hello, channel!');
        expect(messages[1].text).toBe('Hello, user1!');
    });

    it('should throw error if the user is not a member of the channel when fetching messages', async () => {
        const anotherChannel = new Channel({ name: 'anotherChannel', users: [user2._id] });
        await anotherChannel.save();

        await expect(messageService.getChannelMessages(anotherChannel._id, user1._id))
            .rejects.toThrow('User is not a member of this channel');
    });
});
