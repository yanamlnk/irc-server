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

        user1 = new User({ name: 'user1' });
        user2 = new User({ name: 'user2' });
        await user1.save();
        await user2.save();

        channel = new Channel({ name: 'testChannel', users: [user1._id, user2._id] });
        await channel.save();
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    afterEach(async () => {
        await Message.deleteMany({});
        await Channel.deleteMany({});
    });


});
