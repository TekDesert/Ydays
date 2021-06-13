var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser') //use to get req.body

const bcrypt = require("bcrypt");

var ObjectID = require('mongodb').ObjectID;

var mongoose = require('mongoose');

const app = express();
app.use(express.json())

const nodemailer = require("nodemailer");
const jwt = require('jsonwebtoken');

const userModel = require("../models/users");

const { auth } = require("../middlewares/protected");
// create application/json parser
var jsonParser = bodyParser.json()

const reservationModel = require('../models/reservations');

//Confirm Email
router.get("/:token", jsonParser, async (req, res) => {
    
    
  userToken =  req.params.token

   


  jwt.verify(userToken, process.env.TOKEY, async function(err, decoded) {

    if(err){
      //There is an error in the token
      res.status(403).send({message: "Confirmation link is incorrect or expired"})
    }else{

        //Get the id from the JWT token
        userId = jwt.decode(userToken).data
        var id = mongoose.Types.ObjectId(userId);

        //Update the emailConfirmed field to true
        user = await userModel.findOneAndUpdate({_id: id}, { emailConfirmed: true }, {useFindAndModify: false});

        if(user){

            // CACHE MUST BE EMPTIED ON THE MOBILE DEVICE HERE TO DELETE THE COKIE AND THUS INVALIDATE THE LINK
            res.status(200).send({message: "Email confirmed successfully !"});

        }else{
            res.status(500).send({message: "Error while confirming email, please try again later"});
        }

        
        

    }

  });

})

router.get("/QRValidation/:id", jsonParser, async (req, res) => {

  console.log(req.params)

  if(req.params.id !== undefined){

    //Fetch user and current date
    const date = new Date()
    var reservation = await reservationModel.findOne({_id: mongoose.Types.ObjectId(req.params.id)})

    if (reservation.isScanned == 0 ){
 

      console.log("CHECK IN !")
      //user is entering the parking
      reservation.actualArrivalDate = date
      reservation.isScanned = reservation.isScanned + 1

      reservation.save()

      res.status(200).send({message:"Welcome to our parking !"})

    }else if(reservation.isScanned == 1){

      //user is leaving the parking
      console.log("DEPARTURE !")

      var parking = await parkingModel.findOne({_id: mongoose.Types.ObjectId(reservation.parkingId)})
      var user = await userModel.findOne({_id: reservation.userId})

      if (parking && user){ //if user and parking are able to be fetched

        if(user.solde >= totalPrice){ //If user has sufficient funds

          //save departure date
          reservation.actualDepartureDate = date
          reservation.isScanned = reservation.isScanned + 1

          reservation.save()

          //Calculate total price
          var seconds = (Math.abs(reservation.actualArrivalDate - reservation.actualDepartureDate)/1000)

          totalPrice = 0.005*seconds

          totalPrice = (totalPrice < 0.01) ? 0.01 : Math.round(totalPrice * 100) / 100
          
          //deduct price from user funds
          user.solde -= totalPrice
          user.save()

          //Save parking statistics
          parking.totalRevenue += totalPrice
          parking.nbCars -= 1
          parking.save()


          console.log("CHECKOUT !" + (seconds))
          console.log("Total Price : " + totalPrice)

          res.status(200).send([{message:"Thanks for visiting !"}, {total: totalPrice}])


        }else{

        res.status(403).send([{message:"Insufficient fund, please recharge your account"}, {total: totalPrice}])

        }
      
      }else{
        res.status(500).send({message:"error saving your departure, please contact customer support"})
      }
    }
  }
  else{
    res.status(403).send({message:"Please verify your link and try again"})
  }

});


module.exports = router;