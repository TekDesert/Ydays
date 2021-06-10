const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    
    userId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    parkingId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    arrivalDate: {
        type: Date
    },
    departureDate: {
        type: Date
    },
    carPlate: {
        type: String
    },
    QRCode: {
        type: String
    },
    isScanned: {
        type: Number
    },
    actualArrivalDate: {
        type: Date
    },
    actualDepartureDate:{
        type: Date
    },
    transactionConfirmed: {
        type: Boolean
    }
           
});

module.exports = mongoose.model("reservations", userSchema, "reservations"); //export user Schema model refering to "forms" collection
