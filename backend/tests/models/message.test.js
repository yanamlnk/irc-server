const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Message = require('../../models/Message'); // Adjust the path to your model
const User = require('../../models/User'); // Adjust the path if you have a User model
const Channel = require('../../models/Channel'); // Adjust the path if you have a Channel model

describe('Message Model Test', () => {
  let mongoServer;

  // set up in-memory MongoDB server before running tests
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    await Message.syncIndexes();
    await Message.ensureIndexes();
  });

  // clean up database between tests
  afterEach(async () => {
    const collections = mongoose.connection.collections;
        for (const key in collections) {
          await collections[key].deleteMany({});
        }
  });

  // disconnects and stops the in-memory MongoDB server after all tests
  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('should create and save a message successfully', async () => {
    const user = new User({ name: 'Test User' }); // Create a User instance for testing
    await user.save();

    const channel = new Channel({ name: 'Test Channel' }); // Create a Channel instance for testing
    await channel.save();

    const validMessage = new Message({
      text: 'Hello, World!',
      sender: user._id,
      recipient: user._id,
      recipientType: 'User',
      channelContext: new mongoose.Types.ObjectId(), // Ensure new ObjectId() is used here
    });

    const savedMessage = await validMessage.save();
    expect(savedMessage._id).toBeDefined();
    expect(savedMessage.text).toBe('Hello, World!');
    expect(savedMessage.sender).toBe(user._id);
    expect(savedMessage.recipient).toBe(user._id);
    expect(savedMessage.recipientType).toBe('User');
    expect(savedMessage.timestamp).toBeDefined();
  });

  it('should fail when saving a message without a required field', async () => {
    const invalidMessage = new Message({ text: 'Hello!' }); // Missing `sender`, `recipientType`, and `recipient`

    let error;
    try {
      await invalidMessage.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.sender).toBeDefined();
    expect(error.errors.recipientType).toBeDefined();
    expect(error.errors.recipient).toBeDefined();
  });

  it('should enforce recipientType enum values', async () => {
    const user = new User({ name: 'Test User' });
    await user.save();

    const invalidMessage = new Message({
      text: 'Invalid recipient type!',
      sender: user._id,
      recipient: user._id,
      recipientType: 'InvalidType', // Invalid value for recipientType
    });

    let error;
    try {
      await invalidMessage.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.recipientType).toBeDefined();
    expect(error.errors.recipientType.kind).toBe('enum');
  });

  it('should require channelContext if recipientType is User', async () => {
    const user = new User({ name: 'Test User' });
    await user.save();

    const validMessage = new Message({
      text: 'Message with user context',
      sender: user._id,
      recipient: user._id,
      recipientType: 'User',
      channelContext: new mongoose.Types.ObjectId(), // Correct use of ObjectId for User context
    });

    const savedMessage = await validMessage.save();
    expect(savedMessage.channelContext).toBeDefined();

    const invalidMessage = new Message({
      text: 'Message without channel context',
      sender: user._id,
      recipient: user._id,
      recipientType: 'User',
    });

    let error;
    try {
      await invalidMessage.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.channelContext).toBeDefined();
  });

  it('should not require channelContext if recipientType is Channel', async () => {
    const user = new User({ name: 'Test User' });
    await user.save();

    const channel = new Channel({ name: 'Test Channel' });
    await channel.save();

    const validMessage = new Message({
      text: 'Message with channel recipient',
      sender: user._id,
      recipient: channel._id,
      recipientType: 'Channel',
    });

    const savedMessage = await validMessage.save();
    expect(savedMessage.channelContext).toBeUndefined();
  });

  it('should allow multiple messages to be sent to the same recipient', async () => {
    const user = new User({ name: 'Test User' });
    await user.save();
  
    const firstMessage = new Message({
      text: 'First Message',
      sender: user._id,
      recipient: user._id,
      recipientType: 'User',
      channelContext: new mongoose.Types.ObjectId(),
    });
    await firstMessage.save();
  
    const secondMessage = new Message({
      text: 'Second Message',
      sender: user._id,
      recipient: user._id,
      recipientType: 'User',
      channelContext: new mongoose.Types.ObjectId(),
    });
    await secondMessage.save();
  
    const messages = await Message.find({ recipient: user._id, recipientType: 'User' });
  
    expect(messages.length).toBe(2); // Ensure both messages are saved and retrievable
  });
});
