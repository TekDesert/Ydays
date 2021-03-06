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
    parkingSpot: {
        type: String
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
    price: {
        type: Number
    },
    actualDepartureDate:{
        type: Date
    },
    transactionConfirmed: {
        type: Number // 0 is not confirmed ; 1 is confirmed ; 2 is canceled
    }
           
});

module.exports = mongoose.model("reservations", userSchema, "reservations"); //export user Schema model refering to "forms" collection
