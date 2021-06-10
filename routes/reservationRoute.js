var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser') //use to get req.body

const formModel = require("../models/reservations")
const userModel = require("../models/users")

const bcrypt = require("bcrypt");

const qr = require("qrcode");

var ObjectID = require('mongodb').ObjectID;

var mongoose = require('mongoose');
const { auth } = require('../middlewares/protected');
const reservationModel = require('../models/reservations');

const app = express();
app.use(express.json())


// create application/json parser
var jsonParser = bodyParser.json()

sendEmailQR = async (userId) => {

  var userData =  await formModel.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user"
      }
    },
    { $unwind: "$user" },
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    { $project: { "user.password": 0, "user._id":0, "user.username":0, "user.profilePicture":0,"user.isBlocked":0,"user.isAdmin":0, "user.online":0,"user.emailConfirmed":0,"user.__v":0} } // Return all but the specified fields
  ]);

  console.log("hereeeee")
  console.log(userData)
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

  //CREATE JWT TOKEN THAT EXPIRES IN ONE HOUR
  var token = jwt.sign({
    exp: Math.floor(Date.now() / 1000) + (60 * 60),
    data: newUser._id
  }, process.env.TOKEY);

  console.log(token)

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: '"Parking Meeter by Exeption Guys " <avoraparking.meeter@gmail.com>', // sender address
    to: userData.user.email, // list of receivers
    subject: "You're code is generated !🚗✔", // Subject line
    text: "Your QR code is here", // plain text body
    html: `<h1>Hello ${newUser.username} !</h1>
          <h3 style="color:grey">Please find your QRCode below</h3>
          <img style="height:375px;width:500px" src="https://image.freepik.com/vecteurs-libre/mot-bienvenue-personnages-dessins-animes_81522-4207.jpg"> 
          <br>
          <br>`, // html body
  });
}

//PROTECTED ROUTE : We submit a reservation here
router.post("/", [jsonParser,auth, async (req, res) => {
    
    
  userInfos = req.body;

  console.log("Saving your Reservation... : \n" )

  //console.log(req.body)


  if( userInfos.userId && userInfos.arrivalDate  && userInfos.carPlate) {
      
    //userInfos.userId &&  userInfos.parkingId &&
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
          //generation of QR code, this code will be scanned on arrival to parking 
          var qrURL = process.env.API + "/confirmation/QRValidation/"+ id

          //qrURL = bcrypt.hashSync(qrURL, 1);
          //var reservationQR = await reservationModel.findOneAndUpdate({"_id": id}, {"QRCode": "ajdjazijdij"})
          

          qr.toDataURL(qrURL, async (err,src) => {
            if (err){
              console.log("HAAAAAAAAAAAAAAAAA")
              console.log(err)
              res.status(403).send([{message: "error generating QRCode, please try again"}])
            }else{

              
              var newReservation = {

                '_id':  id, //Give temporary objectId before getting the one generated
                "userId": userInfos.userId,
                //"parkingId": userInfos.parkingId,
                "parkingId":new ObjectID(),
                
                "arrivalDate": userInfos.arrivalDate, //Block spot in the parking
                "departureDate": userInfos.departureDate,
                "carPlate": userInfos.carPlate,
                "QRCode": src,
                "isScanned": 0,
                "actualArrivalDate":"",
                "actualDepartureDate": "",
                "transactionConfirmed": false
              }

              var userData = await userModel.findOneAndUpdate(
                {_id: mongoose.Types.ObjectId(userInfos.userId)},
                { $push: { reservations: id  } },
                {useFindAndModify: false}
                )
    
              console.log(userData)
           
              var form = await formModel.create(newReservation, function(err, res) {
                  if (err) throw err;
                  
              })
              //var reservationQR = await reservationModel.findOneAndUpdate({"_id": id}, {"QRCode": src})
              //console.log(reservationQR)
              //console.log(src)
              //console.log(qrURL)

              sendEmailQR(userInfos.userId)

              res.status(200).send([{message: "success"},{_id: newReservation._id, parkingId: newReservation.parkingId, arrivalDate: newReservation.arrivalDate, departureDate: newReservation.departureDate, carPlate: newReservation.carPlate, qrcode: newReservation.QRCode}])
            }
          })
          



         
     // }

  }else{
    res.status(422).send({message: "missing fields"}) 
  }

}])


router.get("/", jsonParser, async (req, res) => {
    

  var getAllForms = await formModel.find({})

  if (getAllUsers) {

    res.status(200).send(getAllUsers) 

  }
  else {

    res.status(500).send({message: "error fetching all users"}) 

  }

})


module.exports = router;