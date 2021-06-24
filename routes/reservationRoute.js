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
const { auth, adminAuth,updateIOT } = require('../middlewares/protected');
const reservationModel = require('../models/reservations');

const nodemailer = require("nodemailer");

const app = express();
app.use(express.json())


// create application/json parser
var jsonParser = bodyParser.json()

sendEmailQR = async (userId, QRCode) => {

 var userData = await userModel.findOne({"_id": mongoose.Types.ObjectId(userId)}, {email: 1, username: 1})


  //console.log("SENDING EMAIL TO : " + userData.user.email)
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
                
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'avoraparking.meeter@gmail.com',
        pass: 'avora2021'
      }
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: '"Parking Meeter by Exeption Guys " <avoraparking.meeter@gmail.com>', // sender address
    to: userData.email, // list of receivers
    subject: "You're code is generated !🚗✔", // Subject line
    text: "Your QR code is here", // plain text body
    html: `<h1>Hello ${userData.username} !</h1>
          <h3 style="color:grey">Please find your QRCode below</h3>
          <img  src="${QRCode}"> 
          <br>
          <br>`, // html body
  });
}

//PROTECTED ROUTE : We submit a reservation here - updateIOT to update our spot status
router.post("/", [jsonParser,auth,updateIOT, async (req, res) => {
    
    
  userInfos = req.body;

  //console.log(req.body)


  if( userInfos.userId && userInfos.arrivalDate  && userInfos.carPlate && userInfos.parkingId && userInfos.parkingSpot) {


          const id = new ObjectID()

          var updateParkingCount = await parkingModel.findOne({_id: mongoose.Types.ObjectId(userInfos.parkingId)})

          if ((updateParkingCount.nbCars + 1) <= (updateParkingCount.capacity)){ //If we haven't reached capacity
            
            //add our car to the total car list
            updateParkingCount.nbCars += 1

            //Search for the spot among the list of parking spots
            for (let i = 0; i < updateParkingCount.emptySpots.length; i++) {

              currentSpot = updateParkingCount.emptySpots[i]

              
              //We found the spot to add our reservation into
              if(currentSpot.spotName === userInfos.parkingSpot){

                parkingFound = true

                //If no departure date is given
                if(userInfos.departureDate == undefined) {

                  var departureDate = new Date(userInfos.arrivalDate)
                  departureDate = departureDate.setTime(departureDate.getTime() + (1*60*60*1000))
  
                }
                else{ 
                  departureDate = userInfos.departureDate //If no departure date is given, we'll reserve the spot for one hour
                }

                dateOverlap = false

                //check if dates overlap
                currentSpot.spotUnavailable.map(spot => {

                  arrival = new Date(userInfos.arrivalDate)    
                  departure = new Date(departureDate)   
                  
                  arrivalCompare = new Date(spot.from)
                  arrivalCompare = arrivalCompare.setSeconds(arrivalCompare.getSeconds() + 1) //add one second to prevent day to day reservations from blocking
                  departureCompare = new Date(spot.to)
                  departureCompare = departureCompare.setSeconds(departureCompare.getSeconds() - 1) //remove one second to prevent day to day reservations from blocking


                  if((arrival <= departureCompare) && (arrivalCompare <= departure)) {
                    //overlapping dates
                   dateOverlap = true
                  }
                })

                //If dates don't overlap
                if(!dateOverlap){

                  currentSpot.spotUnavailable.push({
                    reservationId: id,
                    from: userInfos.arrivalDate,
                    to: departureDate,
                    status: false
                  })
  
                  updateParkingCount.save() 
  
                  break;

                }  
                
              }
              
            }

            if(parkingFound){ //If a parking is found

              if(!dateOverlap){ //If dates don't overlap

                //generation of QR code, this code will be scanned on arrival to parking 
              
              var qrURL = process.env.API + "/confirmation/QRValidation/"+ id
  
              qr.toDataURL(qrURL, async (err,src) => {
                if (err){
                  
                  res.status(403).send([{message: "error generating QRCode, please try again"}])
                }else{
                  
                  var newReservation = {
  
                    '_id':  id, //Give temporary objectId before getting the one generated
                    "userId": userInfos.userId,
                    //"parkingId": userInfos.parkingId,
                    "parkingId": userInfos.parkingId,
                    
                    "arrivalDate": userInfos.arrivalDate, //Block spot in the parking
                    "departureDate": departureDate,
                    "carPlate": userInfos.carPlate,
                    "QRCode": src,
                    "isScanned": 0,
                    "actualArrivalDate":"",
                    "actualDepartureDate": "",
                    "price": 0,
                    "parkingSpot": userInfos.parkingSpot,
                    "transactionConfirmed": 0 //0 is not confirmed ; 1 is confirmed ; 2 is canceled
                  }
  
                  var userData = await userModel.findOneAndUpdate(
                    {_id: mongoose.Types.ObjectId(userInfos.userId)},
                    { $push: { reservations: id  } },
                    {useFindAndModify: false}
                  )
  
                  
                  var saveReservation = await formModel.create(newReservation, function(err, res) {
                      if (err)throw err;
                      
                  })

                  sendEmailQR(userInfos.userId, src)
  
                  res.status(200).send([{message: "success"},{dude: "bro"}])
                }
              })

                

              }else{
                res.status(403).send({message: "Dates overlap"})
              }

            }else{
              res.status(403).send({message: "parking not found"})
            }

            
              
            }
          else{
            res.status(403).send([{message: "error : Parking is full"}])
          }

  }else{
    

    res.status(422).send({message: "missing fields"}) 
  }

}])

//Protected 
router.get("/", [jsonParser, adminAuth, async (req, res) => {
      
    //Optional: we can filter by parking id and/or by arrival date - If no filters we'll display all reservations

    var getAllreservations = await reservationModel.find(
      (req.query.arrivalDate == undefined)? 
        (req.query.parking == undefined)? 
          {} : {parkingId:  req.query.parking} 
        
        : (req.query.parking == undefined)?  
            {arrivalDate:  req.query.arrivalDate}:
              {parkingId:  req.query.parking, arrivalDate:  req.query.arrivalDate}
      ,{}
      )

  

  if (getAllreservations) {

    res.status(200).send(getAllreservations) 

  }
  else {

    res.status(500).send({message: "error fetching all reservations"}) 

  }

}])




//Protected : Get reservation based on the user's ID
router.get("/user/:userId", [jsonParser, auth, async (req, res) => {
  
  
  if(req.params.userId){

    var getUserReservations = await reservationModel.find({userId: mongoose.Types.ObjectId(req.params.userId)})

    if (getUserReservations) {
  
      res.status(200).send(getUserReservations) 
  
    }
    else {
  
      res.status(500).send({message: "error fetching all reservations"}) 
  
    }
    
  }else{
    res.status(422).send({message: "Error : missing field"}) 
  }

 

}])

//Protected : Cancel a reservation by id
router.put("/cancel/:reservationId", [jsonParser, auth, async(req, res) => {

  if(req.params.reservationId && req.params.reservationId.length == 24){
    
    reservation = await reservationModel.findOne({_id: req.params.reservationId},);
    parking = await parkingModel.findOne({_id: reservation.parkingId})
    
    //Search our list of parking spot for the one we canceled our reservation for
    for (let i = 0; i < parking.emptySpots.length; i++) {

      //keep current loop spot saved
      currentSpot = parking.emptySpots[i]
      parkingPlacePosition = -1
      
      //We found the spot to remove our reservation in
      if(currentSpot.spotName === reservation.parkingSpot){

        parkingPlacePosition = i
        spotToDelete = -1

        //check if dates overlap
        currentSpot.spotUnavailable.map((spot,index) => {

          

          if((spot.reservationId).toString() === req.params.reservationId) {
            //save index of reservation to delete in parking empty spot list
            spotToDelete =index
          }

        })

        break;
      }
    }

    if(spotToDelete !== -1 && parkingPlacePosition !== -1){

      parking.nbCars -= 1
      parking.emptySpots[parkingPlacePosition].spotUnavailable.splice(spotToDelete, 1);
      parking.save()

      // make empty spot
      reservation.parkingSpot = ""
      reservation.transactionConfirmed = 2 //cancel reservation
      reservation.save()

      res.status(200).send({message: "reservation canceled successfully"});

    }else{
      res.status(500).send({message: "Error: could not find reservation spot in parking"});
    }

    

  }else{


    res.status(403).send({message: "please provide a valid reservation id"});
  }

}])

//Protected : Get reservation based on the user's ID
router.get("/user/dashboard/:userId", [jsonParser, auth, async (req, res) => {
  
  
  if(req.params.userId){

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
 

      res.status(200).send(reservationStats) 
  
    }
    else {
  
      res.status(500).send({message: "error fetching user reservations"}) 
  
    }
    
  }else{
    res.status(422).send({message: "Error : missing field"}) 
  }

 

}])


module.exports = router;