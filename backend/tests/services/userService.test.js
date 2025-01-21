const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../../models/User');
const userService = require('../../services/userService');

describe('User Service Test', () => {
    let mongoServer;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    afterEach(async () => {
        await User.deleteMany({});
    });

    it('should return user if found', async () => {
        const mockUser = new User({ name: 'testUser' });
        await mockUser.save();
        const result = await userService.getUserByName('testUser');

        expect(result.name).toBe('testUser');
    });

    it('should throw an error if user not found', async () => {
        const nonExistentUserId = new mongoose.Types.ObjectId();

        await expect(userService.getUserByName(nonExistentUserId, 'nonExistentUser'))
                .rejects.toThrow('User not found');
    });

    it('should update the user name if new name is not taken', async () => {
        const mockUser = new User({ name: 'oldName' });
        await mockUser.save();

        const updatedUser = await userService.updateUserName(mockUser._id, 'newName');

        expect(updatedUser.name).toBe('newName');
    });

    it('should throw an error if new name is already taken', async () => {
        const mockUser1 = new User({ name: 'user1' });
        const mockUser2 = new User({ name: 'user2' });
        await mockUser1.save();
        await mockUser2.save();

        await expect(userService.updateUserName(mockUser1._id, 'user2')).rejects.toThrow('Username already taken');
    });

    it('should throw an error if user not found for update', async () => {
        const nonExistentUserId = new mongoose.Types.ObjectId();

        await expect(userService.updateUserName(nonExistentUserId, 'newName'))
            .rejects.toThrow('User not found');
    });

});
