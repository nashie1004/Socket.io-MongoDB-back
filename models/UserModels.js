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
        required: true
    },
    addedFriends: [String],
    messages: [Object]
})

const UserModel = mongoose.model('testUsers', UserSchema)

module.exports = UserModel;