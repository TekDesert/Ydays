const mongoose = require('mongoose');

var spotUnavailable = new mongoose.Schema({
    reservationId: mongoose.Schema.Types.ObjectId,
    from: Date,
    to: Date,
    status: Boolean //0 reserved 1 taken
});

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
    emptySpots: {
        type:[
            {
            spotName: String,
            isOccupied: Boolean, //0 is false, 1 is true if IOT captor detects it
            spotUnavailable:  [spotUnavailable]
            }
        ]
    },
    totalRevenue: {
        type: Number
    }
           
});





module.exports = mongoose.model("parkings", userSchema, "parkings"); //export user Schema model refering to "forms" collection
