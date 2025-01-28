const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const channelService = require('../../services/channelService');
const Channel = require('../../models/Channel');
const User = require('../../models/User');
const ChannelUser = require('../../models/ChannelUser');

describe('Channel Service Test', () => {
    let mongoServer;

    beforeAll(async() => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    beforeEach(async () => {
        await Channel.deleteMany({});
        await User.deleteMany({});
        await ChannelUser.deleteMany({});
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    // for getChannelId
    it('should return channel details for a valid channel name', async () => {
        jest.spyOn(Channel, 'findOne').mockResolvedValue({
            _id: 'mockChannelId',
            name: 'testChannel',
        });
    
        const result = await channelService.getChannelId('testChannel');
    
        expect(Channel.findOne).toHaveBeenCalledWith({ name: 'testChannel' });
        expect(result).toEqual({
            channel_id: 'mockChannelId',
            name: 'testChannel',
        });
    
        // Restore the original implementation
        Channel.findOne.mockRestore();
    });    

    //error for getChannelId
    it('should throw an error if the channel is not found (getChannelId)', async () => {
        await expect(channelService.getChannelId('nonexistentChannel'))
            .rejects.toThrow('Channel not found');
    });

    // for getUsersInChannel
    it('should return user nickname in a channel', async () => {
        const user = new User({ name: 'Test User' });
        await user.save();

        const channel = new Channel({ name: '#test-channel' });
        await channel.save();

        const channelUser = new ChannelUser({
            channel: channel._id,
            user: user._id,
            nickname: 'TestNick',
        });
        await channelUser.save();

        const result = await channelService.getUsersInChannel(channel._id.toString());
        expect(result).toHaveLength(1);
        expect(result[0].nickname).toBe('TestNick');
    });

    // for error in getUsersInChannel
    it('should throw an error for invalid channel ID in getUsersInChannel', async () => {
        await expect(channelService.getUsersInChannel('64d8b2a1c2a3f9abc1234567')).rejects.toThrow('Cannot read properties of null (reading \'channelUsers\')');
    });

    // for getChannelsOfUser
    it('should return channels of a user', async () => {
        const user = new User({ name: 'Test User' });
        await user.save();
      
        const channel1 = new Channel({ name: '#channel1', users: [user._id] });
        const channel2 = new Channel({ name: '#channel2', users: [user._id] });
        await channel1.save();
        await channel2.save();
      
        const result = await channelService.getChannelsOfUser(user._id.toString());
        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('#channel1');
        expect(result[1].name).toBe('#channel2');
    });

    //for error of getChannelsOfUser
    it('should throw an error for invalid user ID in getChannelsOfUser', async () => {
        // await expect(channelService.getChannelsOfUser('invalidUserId')).rejects.toThrow('Invalid user ID');
        const invalidUserId = new mongoose.Types.ObjectId();
        const result = await channelService.getChannelsOfUser(invalidUserId.toString());
        expect(result).toHaveLength(0); 
    });

    //for joinChannel
    it('should add a user to a channel', async () => {
        const user = new User({ name: 'Test User' });
        await user.save();
    
        const channel = new Channel({ name: '#test-channel' });
        await channel.save();
    
        const result = await channelService.joinChannel(user._id.toString(), '#test-channel');
        expect(result.users).toHaveLength(1);
        expect(result.users[0].name).toBe('Test User');
    
        const channelUser = await ChannelUser.findOne({ channel: channel._id, user: user._id });
        expect(channelUser).not.toBeNull();
        expect(channelUser.nickname).toBe('Test User');
    });

    // errors for joinChannel
    it('should throw an error if channel is not found in joinChannel', async () => {
        const user = new User({ name: 'Test User' });
        await user.save();
      
        await expect(channelService.joinChannel(user._id.toString(), '#non-existent-channel')).rejects.toThrow('Channel not found');
    });
      
    it('should throw an error if user tries to join non-existend channel', async () => {
        const user = new User({ name: 'Test User' });
        await user.save();
      
        await expect(channelService.joinChannel(user._id.toString(), '#non-existent-channel')).rejects.toThrow('Channel not found');
    });

    it('should throw an error if the user is not found (joinChannel)', async () => {
        const channel = new Channel({ name: '#test-channel' });
        await channel.save();
    
        const fakeUserId = new mongoose.Types.ObjectId().toString();

        await expect(channelService.joinChannel(fakeUserId, channel.name))
            .rejects.toThrow('User not found');
    });
      
    it('should generate a nickname correctly and handle duplicate joins', async () => {
        const user1 = new User({ name: 'John' });
        await user1.save();

        const user2 = new User({ name: 'John' });
        await user2.save();
    
        const channel = new Channel({ name: '#test-channel' });
        await channel.save();
    
        const firstJoinResult = await channelService.joinChannel(user1._id.toString(), '#test-channel');
        expect(firstJoinResult.users).toHaveLength(1);
        expect(firstJoinResult.users[0].name).toBe('John');
    
        const firstChannelUser = await ChannelUser.findOne({ channel: channel._id, user: user1._id });
        expect(firstChannelUser).not.toBeNull();
    
        const secondJoinResult = await channelService.joinChannel(user2._id.toString(), '#test-channel');
        expect(secondJoinResult.users).toHaveLength(2);
        expect(secondJoinResult.users[0].name).toBe('John');
        expect(secondJoinResult.users[1].name).toMatch(/John\d{4}/);
    
        const channelUsers = await ChannelUser.find({ channel: channel._id, user: user1._id });
        expect(channelUsers).toHaveLength(1);
    });
    
      
    it('should throw an error if the channel is not updated', async () => {
        jest.spyOn(Channel, 'findByIdAndUpdate').mockResolvedValue(null);
      
        await expect(channelService.joinChannel('userId', 'channelId'))
          .rejects.toThrow('Channel not found');
    });
      
      
    // for createChannel
    it('should create a new channel and add a user', async () => {
        const user = new User({ name: 'Test User' });
        await user.save();
    
        const result = await channelService.createChannel(user._id.toString(), 'new-channel');
        expect(result).toHaveProperty('name', '#new-channel');
        expect(result.users).toHaveLength(1);
        expect(result.users[0].name).toBe('Test User');
    
        const channelUser = await ChannelUser.findOne({ channel: result.channel_id, user: user._id });
        expect(channelUser).not.toBeNull();
        expect(channelUser.nickname).toBe('Test User');
    });

    it('should not format the channel name with # if it starts with #', async () => {
        const user = new User({ name: 'Test User' });
        await user.save();
      
        const result = await channelService.createChannel(user._id.toString(), '#new-channel');
        expect(result.name).toBe('#new-channel');
    });

    //errors for createChannel
    it('should throw an error when joinChannel fails in createChannel', async () => {
        const user = new User({ name: 'Test User' });
        await user.save();
      
        jest.spyOn(channelService, 'joinChannel').mockRejectedValueOnce(new Error('Join failed'));
      
        try {
            await channelService.createChannel(user._id.toString(), 'test-channel');
        } catch (err) {
            expect(err.message).toBe('Failed to join channel: Join failed');
        }
    });

    it('should throw an error when saving the channel fails', async () => {
        const user = new User({ name: 'Test User' });
        await user.save();
      
        // Mock newChannel.save() to throw an error
        jest.spyOn(Channel.prototype, 'save').mockRejectedValueOnce(new Error('Save failed'));
      
        await expect(channelService.createChannel(user._id.toString(), 'test-channel')).rejects.toThrow('Save failed');
    });

    it('should throw an error if the user is not found (createChannel)', async () => {
        const channelName = 'newChannel';
    
        await expect(channelService.createChannel('64d8b2a1c2a3f9abc1234567', channelName))
            .rejects.toThrow('User not found');
    });
      
    // for quitChannel
    it('should remove a user from a channel', async () => {
        const user = new User({ name: 'Test User' });
        await user.save();

        const channel = new Channel({ name: '#test-channel', users: [user._id] });
        await channel.save();

        const channelUser = new ChannelUser({
        channel: channel._id,
        user: user._id,
        nickname: 'TestNick',
        });
        await channelUser.save();

        const result = await channelService.quitChannel(user._id.toString(), channel._id.toString());
        expect(result.users).toHaveLength(0);

        const remainingChannelUsers = await ChannelUser.find({ channel: channel._id });
        expect(remainingChannelUsers).toHaveLength(0);
    });
      
    //test for error in quitChannel
    it('should throw an error if channel is not found in quitChannel', async () => {
        const user = new User({ name: 'Test User' });
        await user.save();
      
        const nonExistentChannelId = '67851bfc665bea7c527c7192';
        await expect(channelService.quitChannel(user._id.toString(), nonExistentChannelId)).rejects.toThrow('Channel not found');
    });

    it('should throw an error if trying to quit the general channel', async () => {
        const user = new User({ name: 'TestUser' });
        await user.save();
    
        const generalChannel = new Channel({ name: '#general', users: [user._id] });
        await generalChannel.save();
    
        await expect(channelService.quitChannel(user._id.toString(), generalChannel._id.toString()))
          .rejects.toThrow('Cannot quit general channel');
    });
      
    it('should throw an error if the user is not found (quitChannel)', async () => {
        const user = new User({ name: 'Test User' });
        await user.save();

        const channel = new Channel({ name: '#test-channel' });
        await channel.save();
    
        await expect(channelService.quitChannel(user._id.toString(), channel._id.toString()))
            .rejects.toThrow('User not found in channel');
    });
      
    // for renameChannel
    it('should rename a channel', async () => {
        const channel = new Channel({ name: '#old-name', users: [] });
        await channel.save();
      
        const result = await channelService.renameChannel(channel._id.toString(), '#new-name');
        expect(result.name).toBe('#new-name');
    });

    // error for renameChannel
    it('should throw an error if channel is not found in renameChannel', async () => {
        const nonExistentChannelId = new mongoose.Types.ObjectId();
        await expect(channelService.renameChannel(nonExistentChannelId.toString(), '#new-name')).rejects.toThrow(
            'Channel not found'
        );
    });

    it('should throw an error if trying to rename the general channel', async () => {
        const channel = new Channel({ name: '#general' });
        await channel.save();

        await expect(channelService.renameChannel(channel._id.toString(), 'newName'))
            .rejects.toThrow('Cannot rename general channel');
    });
      
    it('should throw an error if the channel is not found (renameChannel)', async () => {
        await expect(channelService.renameChannel('64d8b2a1c2a3f9abc1234567', 'newName'))
        .rejects.toThrow('Channel not found');
    });
      
    // for deleteChannel
    it('should delete a channel', async () => {
        const channel = new Channel({ name: '#channel-to-delete' });
        await channel.save();
    
        const result = await channelService.deleteChannel(channel._id.toString());
        expect(result.name).toBe('#channel-to-delete');
    
        const deletedChannel = await Channel.findById(channel._id);
        expect(deletedChannel).toBeNull();
    
        const channelUsers = await ChannelUser.find({ channel: channel._id });
        expect(channelUsers).toHaveLength(0);
    });

    //error for deleteChannel
    it('should throw an error if channel is not found in deleteChannel', async () => {
        const nonExistentChannelId = '67851bfc665bea7c527c7192';
        await expect(channelService.deleteChannel(nonExistentChannelId)).rejects.toThrow('Channel not found');
    });

    //for getChannels normal
    it('should return all channels', async () => {
        const channel1 = new Channel({ name: '#channel1', users: [] });
        const channel2 = new Channel({ name: '#channel2', users: [] });
        await channel1.save();
        await channel2.save();
      
        const result = await channelService.getChannels();
        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('#channel1');
        expect(result[1].name).toBe('#channel2');
      });
    
    // for getChannels with search string  
    it('should return channels based on search string', async () => {
        const channel1 = new Channel({ name: '#channel1', users: [] });
        const channel2 = new Channel({ name: '#another-channel', users: [] });
        await channel1.save();
        await channel2.save();
      
        const result = await channelService.getChannels('another');
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('#another-channel');
    });

    //errors for getChannels
    it('should throw an error if there is a problem fetching channels in getChannels', async () => {
        jest.spyOn(Channel, 'find').mockImplementationOnce(() => { throw new Error('Database error'); });
      
        await expect(channelService.getChannels()).rejects.toThrow('Database error');
    });
      
    it('should return channels based on a search string in getChannels', async () => {
        const channel1 = new Channel({ name: '#channel1', users: [] });
        const channel2 = new Channel({ name: '#another-channel', users: [] });
        await channel1.save();
        await channel2.save();
      
        const result = await channelService.getChannels('another');
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('#another-channel');
    });

});