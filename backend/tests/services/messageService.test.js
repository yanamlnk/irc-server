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
        await mongoose.connect(uri);
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    beforeEach(async () => {
        user1 = new User({ name: 'user1' });
        user2 = new User({ name: 'user2' });
        await user1.save();
        await user2.save();
        channel = new Channel({ name: 'testChannel', users: [user1._id, user2._id] });
        await channel.save();
    });


    afterEach(async () => {
        await Message.deleteMany({});
        await Channel.deleteMany({});
        await User.deleteMany({});
    });

    it('should throw an error if message text is empty', () => {
        expect(() => messageService.validateMessage('', 'sender', 'Channel', channel._id))
            .toThrow('Message text cannot be empty');
    });

    it('should throw an error if sender is missing', () => {
        expect(() => messageService.validateMessage('Hello', null, 'Channel', channel._id))
            .toThrow('Sender and recipient are required');
    });

    it('should throw an error if channelId is missing', () => {
        expect(() => messageService.validateMessage('Hello', 'sender', 'Channel', null))
            .toThrow('Channel ID is required');
    });

    it('should throw an error if the channel does not exist', async () => {
        const nonExistentChannelId = new mongoose.Types.ObjectId();
        await expect(messageService.getChannelMessages(nonExistentChannelId))
            .rejects.toThrow('Channel not found');
    });

    it('should save a message successfully', async () => {
        const text = 'New channel message';

        const savedMessage = await messageService.saveMessage({
            text,
            sender: 'user1',
            channelId: channel._id,
        });

        expect(savedMessage).toBeDefined();
        expect(savedMessage.text).toBe(text);
        expect(savedMessage.sender).toBe('user1');
        expect(savedMessage.channelId.toString()).toBe(channel._id.toString());
    });

    it('should throw an error if validation fails', async () => {
        await expect(
            messageService.saveMessage({
                text: '',
                sender: 'user1',
                channelId: channel._id,
            })
        ).rejects.toThrow('Message text cannot be empty');
    });

    it('should create a private message successfully', () => {
        const text = 'Private message';
        const privateMessage = messageService.createPrivateMessage({
            text,
            sender: 'user1',
            recipientName: 'user2',
        });

        expect(privateMessage).toBeDefined();
        expect(privateMessage.text).toBe(text);
        expect(privateMessage.sender).toBe('user1');
        expect(privateMessage.recipientName).toBe('user2');
    });

    it('should throw error when recipient name is missing for private messages', async () => {
        const text = 'Hello';
        const sender = user1._id;
        const recipientType = 'Private';
        const channelId = channel._id;
        const recipientName = null;
      
        expect(() => 
          messageService.validateMessage(text, sender, recipientType, channelId, recipientName)
        ).toThrow('Recipient name is required for private messages');
    });

    it('should handle errors when creating private message', async () => {
        const invalidData = {
          text: null,
          sender: user1._id,
          recipientName: 'user2',
          channelId: channel._id
        };
      
        await expect(async () => {
          await messageService.createPrivateMessage(invalidData);
        }).rejects.toThrow();
    });

    it('should retrieve and format channel messages correctly', async () => {
        const message1 = new Message({
          text: 'Test message 1',
          sender: user1._id,
          recipientType: 'Channel',
          channelId: channel._id,
          timestamp: new Date()
        });
        const message2 = new Message({
          text: 'Test message 2',
          sender: user2._id,
          recipientType: 'Channel',
          channelId: channel._id,
          timestamp: new Date()
        });
        await message1.save();
        await message2.save();
      
        const messages = await messageService.getChannelMessages(channel._id);
      
        expect(messages).toHaveLength(2);
        expect(messages[0]).toMatchObject({
          text: message1.text,
          sender: message1.sender.toString(),
          channelId: expect.any(Object),
          timestamp: message1.timestamp
        });
        expect(messages[1]).toMatchObject({
          text: message2.text,
          sender: message2.sender.toString(),
          channelId: expect.any(Object),
          timestamp: message2.timestamp
        });
      
        expect(messages[0].id).toBeTruthy();
        expect(messages[1].id).toBeTruthy();
      });
});
