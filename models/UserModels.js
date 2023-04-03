const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    profile: {
        type: String,
    },
    addedFriends: [String],
    messages: {
        type: Map,
    },
    
})

const UserModel = mongoose.model('users', UserSchema)

module.exports = UserModel;