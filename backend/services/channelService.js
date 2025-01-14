const mongoose = require('mongoose');
const Channel = require('../models/Channel');

// return all users' names in a channel
async function getUsersInChannel(channelId) {
    if (!mongoose.Types.ObjectId.isValid(channelId)) {
      throw new Error('Invalid channel ID');
    }

    const channel = await Channel.findById(channelId).populate('users', 'name');
//   if (!channel) {
//     throw new Error('Users not found');
//   }
    return channel.users.map(user => ({
      user_id: user._id,
      name: user.name,
    }));
}

// retuns all channels where ther user is present
async function getChannelsOfUser(userID) {
    if (!mongoose.Types.ObjectId.isValid(userID)) {
        throw new Error('Invalid user ID');
    }

    const channels = await Channel.find({ users: userID}).select('_id name');
    // if (channels.length === 0) {
    //     throw new Error('Channels not found');
    // }
    
    return channels.map(channel => ({
        channel_id: channel._id,
        name: channel.name,
    }));
}

//add user to channel
async function addUserToChannel(userId, channelId) {
    try {
        const updatedChannel = await Channel.findByIdAndUpdate(
          channelId,
          { $addToSet: { users: userId } },
          { new: true }
        ).populate('users', 'name');
  
        if (!updatedChannel) {
          throw new Error('Channel not found');
        }
  
        const channelWithMappedUsers = {
          channel_id: updatedChannel._id,
          name: updatedChannel.name,
          users: updatedChannel.users.map(user => ({
            user_id: user._id,
            name: user.name,
          })),
        };

        return channelWithMappedUsers;
    } catch (err) {
        console.error('Error adding user to channel:', err);
        throw err;
    }
}

// create channel
async function createChannel(userID, name) {
    try {
        const newChannel = new Channel({ name: name, users: [] });
        const savedChannel = await newChannel.save();
    
        const updatedChannel = await addUserToChannel(userID, savedChannel._id);
    
        return updatedChannel;
    } catch (err) {
        console.error('Error creating channel with user:', err);
        throw err;
    }
}  

// quit channel
async function quitChannel(userId, channelId) {
    try {
        const updatedChannel = await Channel.findByIdAndUpdate(
          channelId,
          { $pull: { users: userId } },
          { new: true }
        ).populate('users', 'name'); 
    
        if (!updatedChannel) {
          throw new Error('Channel not found');
        }
    
        return {
          channel_id: updatedChannel._id,
          name: updatedChannel.name,
          users: updatedChannel.users.map(user => ({
            user_id: user._id,
            name: user.name,
          })),
        };
    } catch (err) {
        console.error('Error removing user from channel:', err);
        throw err;
    }
}

//method to rename a channel
async function renameChannel(channelId, newName) {
    try {
        const updatedChannel = await Channel.findByIdAndUpdate(
          channelId,
          { name: newName },
          { new: true }
        ).populate('users', 'name');
    
        if (!updatedChannel) {
          throw new Error('Channel not found');
        }
    
        return {
          channel_id: updatedChannel._id,
          name: updatedChannel.name,
          users: updatedChannel.users.map(user => ({
            user_id: user._id,
            name: user.name,
          })),
        };
    } catch (err) {
        console.error('Error renaming channel:', err);
        throw err;
    }
}

// delete channel
async function deleteChannel(channelId) {
    try {
        const deletedChannel = await Channel.findByIdAndDelete(channelId);
  
        if (!deletedChannel) {
          throw new Error('Channel not found');
        }
  
        return {
          channel_id: deletedChannel._id,
          name: deletedChannel.name,
        };
    } catch (err) {
        console.error('Error deleting channel:', err);
        throw err;
    }
}

//list al channels. if string is specified, return channels with this string included (case-insesnsitive)
async function getChannels(searchString = '') {
    try {
        let query = {};
  
        if (searchString) {
          query.name = { $regex: searchString, $options: 'i' };
        }
  
        const channels = await Channel.find(query);
  
        return channels.map(channel => ({
          channel_id: channel._id,
          name: channel.name,
        }));
    } catch (err) {
        console.error('Error fetching channels:', err);
        throw err;
    }
}

module.exports = {
    getUsersInChannel,
    getChannelsOfUser,
    addUserToChannel,
    createChannel,
    quitChannel,
    renameChannel,
    deleteChannel,
    getChannels,
};