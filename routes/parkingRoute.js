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
const { auth, adminAuth, updateIOT } = require('../middlewares/protected');
const reservationModel = require('../models/reservations');

const nodemailer = require("nodemailer");

const app = express();
app.use(express.json())

const jwt = require('jsonwebtoken');
const reservations = require('../models/reservations');
// create application/json parser
var jsonParser = bodyParser.json()

var multer = require('multer')
//const upload = multer({dest: 'images/'})
const axios = require('axios')

const fileStorage = multer.diskStorage({

  destination: (req,file, cb) => {
    cb(null, './assets/images')
  },
  filename: (req, file, cb) => {
    if(file !== undefined){

      cb(null,  file.originalname)
    }
    
  }
})

const {uploadFile} = require('../s3')

const upload = multer({storage: fileStorage})

//Protected : Add a parking
router.post("/", [jsonParser, adminAuth,upload.single('image'),   async (req, res) => {
  
        
        parkingInfo = req.body;

        if(parkingInfo.name && parkingInfo.description && parkingInfo.coord && parkingInfo.capacity){

          var image = "default.jpg"
            //si il y'a une image a upload
            if(req.file !== undefined) {
              const result = await uploadFile(req.file) 
              var image = req.file.originalname
            }

            //Every empty spot in our parking
            emptySpotList = [];
            

            for (let i = 0; i < parkingInfo.capacity; i++) {
              
 
              emptySpotItem = {
                spotName: "A"+i,
                isOccupied: false,
                spotUnavailable: [] 
                /*
                This can is an example of what can be inside spotUnavailable
                {
                  reservationId: mongoose.Types.ObjectId("60c6726d3b70302b18b1fef9"),
                  from: Date.now(),
                  to: Date.now(),
                  status: 0 //0 reserved 1 taken
                }
                */
              } 
              emptySpotList.push(emptySpotItem) 
            }

            var newParking = {
                "name": parkingInfo.name,
                "description": parkingInfo.description,
                "coord": JSON.parse(parkingInfo.coord), //
                "image": image,
                "nbCars": 0,
                "capacity": parkingInfo.capacity,
                "totalRevenue": 0,
                "emptySpots": emptySpotList
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

router.delete("/:id", [jsonParser, adminAuth, async (req, res) => {


  if(req.params.id){
    parkingId = req.params.id

    deletedParking = await parkingModel.findOneAndDelete({_id:parkingId})

    if(deletedParking){
      
      //delete all subsequent reservation that had this parking as its parking
      deletedReservations = await reservationModel.deleteMany({parkingId: deletedParking._id})

      res.status(200).send({message: "Parking and reservations successfully deleted"})
    }else{
      res.status(403).send({message: "Error while deleting parking, please verify the parking id"})
    }

  }else{
    res.status(403).send({message: "Please provide a parking to delete"})
  }

}])


//Protected : Get all reservations for a parking to see what are the times that it is empty to make a reservation
router.get("/freespace/:parkingId", [jsonParser, auth, updateIOT, async (req, res) => {


  if(req.params.parkingId){

    if(req.params.parkingId.length < 24){
      res.status(422).send({message: "Error : invalid parking id"}) 
    }

    const parking = await parkingModel.find({_id: mongoose.Types.ObjectId(req.params.parkingId)})
    const reservations = await reservationModel.find({parkingId: req.params.parkingId})

    var unavailableTimes = []

      if(parking.length !== 0){

        // reservations.map(reservation => (

        //   unavailableTimes.push({from: reservation.arrivalDate, to: reservation.departureDate})

        // ))
        //Get each parking place freespot status and timeline
        parking[0].emptySpots.map(spot => (
          unavailableTimes.push(spot)
         
        ))

        
        console.log("is occupied " + res.locals.IOT_STATUS)
        
        IOT_ONOFF = (res.locals.IOT_DEVICEON )? "IOT device is on !" : "IOT device is off or timed out..." //get the status of the IOT

        res.status(200).send({reservedSpotTime: unavailableTimes, isOccupied: res.locals.IOT_STATUS, IOT_ONOFF: IOT_ONOFF }) //Is occupied is set to true if 
      }else{
        res.status(422).send({message: "Error : parking has no reservation or doesn't exist"}) 
      } 


    }else{
        res.status(422).send({message: "Error : missing field"}) 
    }    

}])

//Get a specific parking, protected
router.get("/:id", [jsonParser, auth,updateIOT, async (req, res) => {

  if(req.params.id.length == 24){

    parking = await parkingModel.findOne({_id: mongoose.Types.ObjectId(req.params.id)})

    if(parking){
      res.status(200).send({message: "Fetched parking successfully", parking: parking, isOccupied: res.locals.IOT_STATUS,})
    }else{
      res.status(403).send({message: "parking not found"})
    }

    

  }else{
    res.status(403).send({message: "Please provide a valid parking ID"})
  }

}])

//Protected : Add a parking
router.get("/", [jsonParser, adminAuth,updateIOT, async (req, res) => {


  //get all parking dashboard statistics

  parkings = await parkingModel.find({});

      if(parkings){

        const Totalparkings = [];
        var capacity;
        var revenue = 0;
        var averagefilling = 0;
        var totalnbCars = 0;

        parkings.map((parking, loop) => {

          //calculate % of space used
          capacity = (parking.nbCars / parking.capacity) * 100
          capacity = Math.round((capacity) * 100) / 100

          //calculate globale revenue
          averagefilling = (loop == 0) ? averagefilling =   capacity : averagefilling = (averagefilling +  capacity)/(loop+1)

          revenue = revenue +  parking.totalRevenue

          totalnbCars += parking.nbCars

          Totalparkings.push({parking: parking, remplissage: capacity})

        })

        res.status(200).send([{message: "parkings found !"}, {totalParkings: Totalparkings, globalRevenue: revenue,averagefilling: averagefilling, totalnbCars: totalnbCars}])

      }else{
          res.status(422).send({message: "Error : missing field"}) 
      }



}])



module.exports = router;