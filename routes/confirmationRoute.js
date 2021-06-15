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
const parkingModel = require("../models/parkings");

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

//Contact us
router.post("/contactus", jsonParser, async (req, res) => {
    
    
  contact =  req.body

  if(contact.name, contact.email, contact.phone, contact.message){

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
      to: "avoraparking.meeter@gmail.com", // send email to us
      subject: "A client needs support !", // Subject line
      text: `a Mr(s).${contact.name} has submitted a request`, // plain text body
      html: `<h1>Hello </h1>
            <h3 style="color:grey">Please find the client's query below</h3>
            <h4>Name : ${contact.name} </h4>
            <h4>Phone: ${contact.phone} </h4> 
            <h4>Message:
            <p> ${contact.message}</p>
            </h4>
            `, // html body
    });

    // send mail with defined transport object
    let info2 = await transporter.sendMail({
      from: '"Parking Meeter by Exeption Guys " <avoraparking.meeter@gmail.com>', // sender address
      to: contact.email, // send email to us
      subject: "Thank you for contacting us !", // Subject line
      text: `your query has been received`, // plain text body
      html: `<h1>Hello ${contact.name}</h1>
            <h3 style="color:grey">Your query has been successfully received :</h3>
            <hr>
            <h4>Name : ${contact.name} </h4>
            <h4>Phone: ${contact.phone} </h4> 
            <h4>Message:
            <p> ${contact.message}</p>
            </h4>
            <hr>
            <h3>Please allow 2-3 business days for a response </h3>
            `, // html body
    });

    res.status(200).send({message: "request sent !"})
      
    }else{
      //There is an error in the token

      console.log(req.body)

      res.status(403).send({contact : req.body})    

    }

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

        //Calculate total price
        var seconds = (Math.abs(reservation.actualArrivalDate - date)/1000)

        totalPrice = 0.005*seconds

        totalPrice = (totalPrice < 0.01) ? 0.01 : Math.round(totalPrice * 100) / 100

        if(user.solde >= totalPrice){ //If user has sufficient funds

          
          //Save parking statistics
          parking.totalRevenue += totalPrice
          parking.nbCars -= 1
          //Make parking spot re-appear in list of available parking spots
          parking.emptySpots.push(reservation.parkingSpot)
          parking.save()

          //save departure date
          reservation.actualDepartureDate = date
          reservation.transactionConfirmed = 1
          reservation.price += totalPrice 
          reservation.isScanned = reservation.isScanned + 1
          reservation.parkingSpot= ""

          

          reservation.save()

          
          
          //deduct price from user funds
          user.solde -= totalPrice
          user.save()

          


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