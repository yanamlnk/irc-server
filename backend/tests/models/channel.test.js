const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Channel = require('../../models/Channel');
const ChannelUser = require('../../models/ChannelUser');

describe('Channel Model Test', () => {
  let mongoServer;

  // created in-memory MongoDB server before running tests
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    await Channel.syncIndexes(); 
    await Channel.ensureIndexes();
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

  it('should create and save a channel successfully', async () => {
    const validChannel = new Channel({ name: 'Test Channel' });
    const savedChannel = await validChannel.save();

    expect(savedChannel._id).toBeDefined();
    expect(savedChannel.name).toBe('Test Channel');
    expect(savedChannel.users).toEqual([]);
  });

  it('should fail when saving a channel without a required field', async () => {
    const invalidChannel = new Channel({});

    let error;
    try {
      await invalidChannel.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.name).toBeDefined();
    expect(error.errors.name.kind).toBe('required');
  });

  it('should enforce unique channel names', async () => {
    const channel1 = new Channel({ name: 'Unique Channel' });
    await channel1.save();
  
    const channel2 = new Channel({ name: 'Unique Channel' });
  
    let error;
    try {
      await channel2.save();
    } catch (err) {
      error = err;
    }
  
    expect(error).toBeDefined();
    expect(error.name).toBe('MongoServerError');
    expect(error.code).toBe(11000); // Duplicate key error
  });

  it('should correctly associate a ChannelUser with a Channel', async () => {
    const channel = new Channel({ name: 'Test Channel' });
    await channel.save();

    const channelUser = new ChannelUser({
      channel: channel._id,
      user: new mongoose.Types.ObjectId(),
      nickname: 'Test Nickname',
    });
    await channelUser.save();

    const foundChannelUser = await ChannelUser.findOne({ channel: channel._id });

    expect(foundChannelUser).toBeDefined();
    expect(foundChannelUser.channel.toString()).toBe(channel._id.toString());
    expect(foundChannelUser.nickname).toBe('Test Nickname');
  });

  it('should populate the virtual field "channelUsers" for a Channel', async () => {
    const channel = new Channel({ name: 'Populated Channel' });
    await channel.save();

    const user1 = new mongoose.Types.ObjectId();
    const user2 = new mongoose.Types.ObjectId();

    const channelUser1 = new ChannelUser({
      channel: channel._id,
      user: user1,
      nickname: 'User1 Nickname',
    });
    const channelUser2 = new ChannelUser({
      channel: channel._id,
      user: user2,
      nickname: 'User2 Nickname',
    });
    await channelUser1.save();
    await channelUser2.save();

    const populatedChannel = await Channel.findById(channel._id).populate('channelUsers');

    expect(populatedChannel.channelUsers).toBeDefined();
    expect(populatedChannel.channelUsers.length).toBe(2);

    const nicknames = populatedChannel.channelUsers.map((cu) => cu.nickname);
    expect(nicknames).toContain('User1 Nickname');
    expect(nicknames).toContain('User2 Nickname');
  });

  it('should enforce uniqueness for channel-user pairs in ChannelUser', async () => {
    const channel = new Channel({ name: 'Unique Channel' });
    await channel.save();

    const userId = new mongoose.Types.ObjectId();

    const channelUser1 = new ChannelUser({
      channel: channel._id,
      user: userId,
      nickname: 'Unique Nickname',
    });
    await channelUser1.save();

    const channelUser2 = new ChannelUser({
      channel: channel._id,
      user: userId,
      nickname: 'Duplicate Nickname',
    });

    let error;
    try {
      await channelUser2.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.name).toBe('MongoServerError');
    expect(error.code).toBe(11000); // Duplicate key error
  });
it('should correctly associate a ChannelUser with a Channel', async () => {
    const channel = new Channel({ name: 'Test Channel' });
    await channel.save();

    const channelUser = new ChannelUser({
      channel: channel._id,
      user: new mongoose.Types.ObjectId(),
      nickname: 'Test Nickname',
    });
    await channelUser.save();

    const foundChannelUser = await ChannelUser.findOne({ channel: channel._id });

    expect(foundChannelUser).toBeDefined();
    expect(foundChannelUser.channel.toString()).toBe(channel._id.toString());
    expect(foundChannelUser.nickname).toBe('Test Nickname');
  });

  it('should populate the virtual field "channelUsers" for a Channel', async () => {
    const channel = new Channel({ name: 'Populated Channel' });
    await channel.save();

    const user1 = new mongoose.Types.ObjectId();
    const user2 = new mongoose.Types.ObjectId();

    const channelUser1 = new ChannelUser({
      channel: channel._id,
      user: user1,
      nickname: 'User1 Nickname',
    });
    const channelUser2 = new ChannelUser({
      channel: channel._id,
      user: user2,
      nickname: 'User2 Nickname',
    });
    await channelUser1.save();
    await channelUser2.save();

    const populatedChannel = await Channel.findById(channel._id).populate('channelUsers');

    expect(populatedChannel.channelUsers).toBeDefined();
    expect(populatedChannel.channelUsers.length).toBe(2);

    const nicknames = populatedChannel.channelUsers.map((cu) => cu.nickname);
    expect(nicknames).toContain('User1 Nickname');
    expect(nicknames).toContain('User2 Nickname');
  });

  it('should enforce uniqueness for channel-user pairs in ChannelUser', async () => {
    const channel = new Channel({ name: 'Unique Channel' });
    await channel.save();

    const userId = new mongoose.Types.ObjectId();

    const channelUser1 = new ChannelUser({
      channel: channel._id,
      user: userId,
      nickname: 'Unique Nickname',
    });
    await channelUser1.save();

    const channelUser2 = new ChannelUser({
      channel: channel._id,
      user: userId,
      nickname: 'Duplicate Nickname',
    });

    let error;
    try {
      await channelUser2.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.name).toBe('MongoServerError');
    expect(error.code).toBe(11000); // Duplicate key error
  });
});
