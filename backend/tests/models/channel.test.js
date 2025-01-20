const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Channel = require('../../models/Channel'); // Adjust the path to your model

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
});
