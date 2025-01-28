const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const ChannelUser = require('../../models/ChannelUser'); 
const Channel = require('../../models/Channel'); 
const User = require('../../models/User'); 

describe('ChannelUser Model Test', () => {
  let mongoServer;

  // sets up in-memory MongoDB server before running tests
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    await ChannelUser.syncIndexes();
    await Channel.syncIndexes();
    await User.syncIndexes();

    await ChannelUser.ensureIndexes();
    await Channel.ensureIndexes();
    await User.ensureIndexes();
  });

  // cleans up database between tests
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

  it('should create and save a ChannelUser successfully', async () => {
    const channel = new Channel({ name: 'Test Channel' });
    await channel.save();

    const user = new User({ name: 'Test User' });
    await user.save();

    const validChannelUser = new ChannelUser({
      channel: channel._id,
      user: user._id,
      nickname: 'CoolNick',
    });

    const savedChannelUser = await validChannelUser.save();
    expect(savedChannelUser._id).toBeDefined();
    expect(savedChannelUser.channel.toString()).toBe(channel._id.toString());
    expect(savedChannelUser.user.toString()).toBe(user._id.toString());
    expect(savedChannelUser.nickname).toBe('CoolNick');
  });

  it('should fail when saving without a required field', async () => {
    const channel = new Channel({ name: 'Test Channel' });
    await channel.save();

    const invalidChannelUser = new ChannelUser({
      channel: channel._id, // Missing `user` and `nickname`
    });

    let error;
    try {
      await invalidChannelUser.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.user).toBeDefined();
    expect(error.errors.nickname).toBeDefined();
  });

  it('should enforce the unique index for channel and user combination', async () => {
    const channel = new Channel({ name: 'Test Channel' });
    await channel.save();

    const user = new User({ name: 'Test User' });
    await user.save();

    const firstChannelUser = new ChannelUser({
      channel: channel._id,
      user: user._id,
      nickname: 'FirstNick',
    });
    await firstChannelUser.save();

    const duplicateChannelUser = new ChannelUser({
      channel: channel._id,
      user: user._id,
      nickname: 'SecondNick',
    });

    let error;
    try {
      await duplicateChannelUser.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.code).toBe(11000); // Duplicate key error
  });

  it('should allow different users to have the same nickname in the same channel', async () => {
    const channel = new Channel({ name: 'Test Channel' });
    await channel.save();

    const user1 = new User({ name: 'User1' });
    await user1.save();

    const user2 = new User({ name: 'User2' });
    await user2.save();

    const channelUser1 = new ChannelUser({
      channel: channel._id,
      user: user1._id,
      nickname: 'SameNick',
    });
    await channelUser1.save();

    const channelUser2 = new ChannelUser({
      channel: channel._id,
      user: user2._id,
      nickname: 'SameNick', // Same nickname but different user
    });
    await channelUser2.save();

    const channelUsers = await ChannelUser.find({ channel: channel._id, nickname: 'SameNick' });
    expect(channelUsers.length).toBe(2);
  });

  it('should allow the same user to join multiple channels with different nicknames', async () => {
    const channel1 = new Channel({ name: 'Channel1' });
    await channel1.save();

    const channel2 = new Channel({ name: 'Channel2' });
    await channel2.save();

    const user = new User({ name: 'Test User' });
    await user.save();

    const channelUser1 = new ChannelUser({
      channel: channel1._id,
      user: user._id,
      nickname: 'Nick1',
    });
    await channelUser1.save();

    const channelUser2 = new ChannelUser({
      channel: channel2._id,
      user: user._id,
      nickname: 'Nick2',
    });
    await channelUser2.save();

    const userInChannels = await ChannelUser.find({ user: user._id });
    expect(userInChannels.length).toBe(2);
    expect(userInChannels[0].nickname).toBe('Nick1');
    expect(userInChannels[1].nickname).toBe('Nick2');
  });
});
