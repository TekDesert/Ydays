var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser') //use to get req.body

const formModel = require("../models/reservations")
const userModel = require("../models/users")
const parkingModel = require("../models/parkings")

const bcrypt = require("bcrypt");

const qr = require("qrcode");

var ObjectID = require('mongodb').ObjectID;

var mongoose = require('mongoose');
const { auth, adminAuth } = require('../middlewares/protected');
const reservationModel = require('../models/reservations');

const nodemailer = require("nodemailer");

const app = express();
app.use(express.json())

const jwt = require('jsonwebtoken');
// create application/json parser
var jsonParser = bodyParser.json()


//Protected : Add a parking
router.post("/", [jsonParser, adminAuth, async (req, res) => {
  
    //Un nom, une description, des coordonnées GPS (X, Y), une photo, total véhicules présents, capacité.


        parkingInfo = req.body;

        if(parkingInfo.name && parkingInfo.description && parkingInfo.coord && parkingInfo.capacity){

            const image = (parkingInfo.image === undefined) ? "default.jpg" :  parkingInfo.image

            var newParking = {
                "name": parkingInfo.name,
                "description": parkingInfo.description,
                "coord": parkingInfo.coord,
                "image": image,
                "nbCars": 0,
                "capacity": parkingInfo.capacity,
                "totalRevenue": 0
            }

            parkingModel.create(newParking, function(err, res) {
                if (err) throw err;
                
            })

            res.status(200).send([{message: "parking created successfully !"}, {newParking}])


        }else{
            res.status(422).send({message: "Error : missing field"}) 
        }

    /* {
        "name": "JurassicPark",
        "description": "my park",
        "coord": [1,25],
        "image": "yes",
        "nbCars": 15,
        "capacity": 70
    } */

    

 /*  if(req.params.userId){

    var getUserReservations = await reservationModel.find({userId: mongoose.Types.ObjectId(req.params.userId)})

    var getUserSolde = await userModel.find({_id: mongoose.Types.ObjectId(req.params.userId)},{solde:1})

    getUserSolde = getUserSolde[0].solde

    if (getUserReservations && getUserSolde) {

      var totalPrice = 0;
      var totalTime = 0;
      //For each user reservation, we will take the reservation's info and add it to get global statistics
      getUserReservations.map( reservation => {


        totalTime += (Math.abs(reservation.arrivalDate - reservation.departureDate)/60000)

        totalPrice += reservation.price
        

      })

    const reservationStats = {
      totalReservations: getUserReservations.length,
      totalPrice: totalPrice,
      totalTime: totalTime,
      userSolde: getUserSolde
    }
    console.log(reservationStats)

      res.status(200).send(reservationStats) 
  
    }
    else {
  
      res.status(500).send({message: "error fetching user reservations"}) 
  
    }
    
  }else{
    res.status(422).send({message: "Error : missing field"}) 
  }
 */
 

}])

//Protected : Add a parking
router.get("/", [jsonParser, adminAuth, async (req, res) => {


  //get all parking dashboard statistics

  parkings = await parkingModel.find({});

      if(parkings){

        const Totalparkings = [];
        var capacity;
        var revenue = 0;

        parkings.map(parking => {

          //calculate % of space used
          capacity = (parking.nbCars / parking.capacity) * 100
          capacity = Math.round((capacity) * 100) / 100

          //calculate globale revenue
          revenue = revenue +  parking.totalRevenue

          

          Totalparkings.push({parking: parking, remplissage: capacity})

        })

        res.status(200).send([{message: "parkings found !"}, {totalParkings: Totalparkings, globalRevenue: revenue}])

      }else{
          res.status(422).send({message: "Error : missing field"}) 
      }



}])


module.exports = router;