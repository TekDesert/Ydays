const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    userId: {
        type: String
    },
    uniqueLink: {
        type: String
    },
    expirationDate: {
        type: Date
    },
    reset: {
        type: String
    }
           
});

module.exports = mongoose.model("users", userSchema, "users"); //export user Schema model refering to "users" collection
