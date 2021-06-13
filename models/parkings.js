const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    
    name: {
        type: String
    },
    description: {
        type: String
    },
    coord: {
        type: [Number]
    },
    image: {
        type: String
    },
    nbCars: {
        type: Number
    },
    capacity: {
        type: Number
    },
    totalRevenue: {
        type: Number
    }
           
});

module.exports = mongoose.model("parkings", userSchema, "parkings"); //export user Schema model refering to "forms" collection
