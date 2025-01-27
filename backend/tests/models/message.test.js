const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Message = require('../../models/Message');  
const Channel = require('../../models/Channel'); 

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

  it('should create and save a message with recipientType "Channel"', async () => {
    const channel = new Channel({ name: 'Test Channel' });
    await channel.save();

    const validMessage = new Message({
      text: 'Hello, Channel!',
      sender: 'Test Sender',
      recipientType: 'Channel',
      channelId: channel._id,
    });

    const savedMessage = await validMessage.save();
    expect(savedMessage._id).toBeDefined();
    expect(savedMessage.text).toBe('Hello, Channel!');
    expect(savedMessage.sender).toBe('Test Sender');
    expect(savedMessage.recipientType).toBe('Channel');
    expect(savedMessage.channelId.toString()).toBe(channel._id.toString());
    expect(savedMessage.timestamp).toBeDefined();
  });

  it('should fail validation if recipientType is "Channel" but channelId is missing', async () => {
    const invalidMessage = new Message({
      text: 'Missing channelId',
      sender: 'Test Sender',
      recipientType: 'Channel',
    });

    let error;
    try {
      await invalidMessage.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.channelId).toBeDefined();
    expect(error.errors.channelId.kind).toBe('required');
  });

  it('should fail when saving a message without required fields', async () => {
    const invalidMessage = new Message({ text: 'Hello!' }); // Missing `sender`, `recipientType`

    let error;
    try {
      await invalidMessage.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.sender).toBeDefined();
    expect(error.errors.recipientType).toBeDefined();
  });

  it('should enforce recipientType enum values', async () => {
    const invalidMessage = new Message({
      text: 'Invalid recipient type!',
      sender: 'Test Sender',
      recipientType: 'InvalidType',
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

  it('should allow multiple messages to be sent to the same recipient', async () => {
    const channel = new Channel({ name: 'Test Channel' });
    await channel.save();

    const firstMessage = new Message({
      text: 'First Message',
      sender: 'Test Sender',
      recipientType: 'Channel',
      channelId: channel._id,
    });
    await firstMessage.save();

    const secondMessage = new Message({
      text: 'Second Message',
      sender: 'Test Sender',
      recipientType: 'Channel',
      channelId: channel._id,
    });
    await secondMessage.save();

    const messages = await Message.find({ channelId: channel._id, recipientType: 'Channel' });

    expect(messages.length).toBe(2); 
  });

  it('should set a default timestamp if none is provided', async () => {
    const channel = new Channel({ name: 'Test Channel' });
    await channel.save();

    const validMessage = new Message({
      text: 'Timestamp test',
      sender: 'Test Sender',
      recipientType: 'Channel',
      channelId: channel._id,
    });

    const savedMessage = await validMessage.save();
    expect(savedMessage.timestamp).toBeDefined();
    expect(savedMessage.timestamp).toBeInstanceOf(Date);
  });
});
