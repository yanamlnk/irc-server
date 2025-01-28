const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../../models/User'); // Adjust the path to your model

describe('User Model Test', () => {
  let mongoServer;

  // set up in-memory MongoDB server before running tests
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    await User.syncIndexes();
    await User.ensureIndexes()
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

  it('should create and save a user successfully', async () => {
    const validUser = new User({ name: 'Test User' });
    const savedUser = await validUser.save();

    expect(savedUser._id).toBeDefined();
    expect(savedUser.name).toBe('Test User');
  });

  it('should fail when saving a user without a required field', async () => {
    const invalidUser = new User({}); // Missing `name`

    let error;
    try {
      await invalidUser.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.name).toBeDefined();
    expect(error.errors.name.kind).toBe('required');
  });
});
