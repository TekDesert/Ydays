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

    const date = new Date()

    var reservation = await reservationModel.findOne({_id: mongoose.Types.ObjectId(req.params.id)})

    if (reservation.isScanned === 0 ){

      console.log("CHECK IN !")

      reservation.actualArrivalDate = date
      reservation.isScanned = reservation.isScanned + 1

      reservation.save()
    }else if(reservation.isScanned === 1){

      console.log("DEPARTURE !")

      reservation.actualDepartureDate = date
      reservation.isScanned = reservation.isScanned + 1

      reservation.save()

    }else{

      var seconds = (reservation.actualDepartureDate.getTime() - reservation.actualArrivalDate.getTime()) / 1000;

      console.log("CHECKOUT !" + (seconds))
    }

    var userData = await reservationModel.findOneAndUpdate(
      {_id: mongoose.Types.ObjectId(req.params.id)},
      { actualArrivalDate: date, $inc:{ isScanned: 1}   },
      {useFindAndModify: false}
    )

    res.status(200).send({message:"Welcome to our parking !!!"})

  }else{
    res.status(403).send({message:"Please verify your link and try again"})
  }

  

})




module.exports = router;