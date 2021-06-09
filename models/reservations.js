const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    
    userId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    parkingId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    arrivalDate: {
        type: String
    },
    departureDate: {
        type: String
    },
    carPlate: {
        type: String
    },
    QRCode: {
        type: String
    },
           
});

module.exports = mongoose.model("reservations", userSchema, "reservations"); //export user Schema model refering to "forms" collection
