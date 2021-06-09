const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    username: {
        type: String
    },
    profilePicture: {
        type: String
    },
    email: {
        type: String
    },
    solde: {
        type: Number
    },
    reservations: [],
    password: {
        type: String
    },
    online: {
        type: Boolean
    },
    isBlocked: {
        type: Boolean
    },
    isAdmin: {
        type: Boolean
    },
    emailConfirmed: {
        type: Boolean
    }
           
});

module.exports = mongoose.model("users", userSchema, "users"); //export user Schema model refering to "users" collection
