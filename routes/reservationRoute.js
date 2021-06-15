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

//PROTECTED ROUTE : We submit a reservation here
router.post("/", [jsonParser,auth, async (req, res) => {
    
    
  userInfos = req.body;

  console.log("Saving your Reservation... : \n" )

  //console.log(req.body)


  if( userInfos.userId && userInfos.arrivalDate  && userInfos.carPlate && userInfos.parkingId && userInfos.parkingSpot) {
      
      console.log("GOOD FOR RESERVATION !")

      /*var checkAlreadyExist = await userModel.findOne({"email": userInfos.email})

      if (checkAlreadyExist) {

        res.status(409).send({message: "user already exists"}) 

      }
      else {*/
        //set departure date
        

          //get the user that has done the reservation
          /*var userData =  await formModel.aggregate([
            {
              $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "user"
              }
            },
            { $unwind: "$user" },
            { $match: { userId: mongoose.Types.ObjectId("60c1dbaf31a1f72cc4b25631") } },
            { $project: { "user.password": 0, "user._id":0, "user.username":0, "user.profilePicture":0,"user.isBlocked":0,"user.isAdmin":0, "user.online":0,"user.emailConfirmed":0,"user.__v":0} } // Return all but the specified fields
          ]);*/


          

          const id = new ObjectID()

          var updateParkingCount = await parkingModel.findOne({_id: mongoose.Types.ObjectId(userInfos.parkingId)})

          if ((updateParkingCount.nbCars + 1) <= (updateParkingCount.capacity)){ //If we haven't reached capacity
            
            //add our car to the total car list
            updateParkingCount.nbCars += 1
            //Remove the spot from the list of available spots
            const removeSpot = updateParkingCount.emptySpots.indexOf(userInfos.parkingSpot); 
            if (removeSpot > -1) {
              updateParkingCount.emptySpots.splice(removeSpot, 1);
              updateParkingCount.save()
             
              //generation of QR code, this code will be scanned on arrival to parking 
              var qrURL = process.env.API + "/confirmation/QRValidation/"+ id
  
              qr.toDataURL(qrURL, async (err,src) => {
                if (err){
                  console.log(err)
                  res.status(403).send([{message: "error generating QRCode, please try again"}])
                }else{
                  
                  var newReservation = {
  
                    '_id':  id, //Give temporary objectId before getting the one generated
                    "userId": userInfos.userId,
                    //"parkingId": userInfos.parkingId,
                    "parkingId": userInfos.parkingId,
                    
                    "arrivalDate": userInfos.arrivalDate, //Block spot in the parking
                    "departureDate": userInfos.departureDate,
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
  
                  
        
                  console.log(userData)
              
                  var saveReservation = await formModel.create(newReservation, function(err, res) {
                      if (err)throw err;
                      
                  })
                  
  
                  //var reservationQR = await reservationModel.findOneAndUpdate({"_id": id}, {"QRCode": src})
                  //console.log(reservationQR)
                  //console.log(src)
                  //console.log(qrURL)
  
                
  
                  sendEmailQR(userInfos.userId, src)
  
                  res.status(200).send([{message: "success"},{_id: newReservation._id, parkingId: newReservation.parkingId, arrivalDate: newReservation.arrivalDate, departureDate: newReservation.departureDate, carPlate: newReservation.carPlate, qrcode: newReservation.QRCode}])
                }
              })

            }else{
              res.status(403).send([{message: "error: specified parking spot does not exist or is not available"}])
            }
        
          }else{
            res.status(403).send([{message: "error : Parking is full"}])
          }

         



         
     // }

  }else{
    res.status(422).send({message: "missing fields"}) 
  }

}])

//Protected 
router.get("/", [jsonParser, adminAuth, async (req, res) => {
      
    //Optional: we can filter by parking id and/or by arrival date - If no filters we'll display all reservations

    console.log( req.query.parking)

    console.log(req.query.arrivalDate )



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
    console.log(reservationStats)

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