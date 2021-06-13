var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser') //use to get req.body

const userModel = require("../models/users")

const bcrypt = require("bcrypt");

const ObjectID = require('mongodb').ObjectID;

const mongoose = require('mongoose');

const app = express();
app.use(express.json())

const nodemailer = require("nodemailer");
const jwt = require('jsonwebtoken');

const { auth, adminAuth } = require('../middlewares/protected');
// create application/json parser
var jsonParser = bodyParser.json()


const fs = require('fs');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);

const xoauth2 = require("xoauth2");

router.post("/", jsonParser, async (req, res) => {
    
    
  userInfos = req.body;

  console.log("Registering user.... : \n" )

  console.log(req.body)


  if(userInfos.username &&  userInfos.email && userInfos.carPlate && userInfos.password && userInfos.passwordConfirm) {

    if(userInfos.password === userInfos.passwordConfirm){

      console.log("GOOD FOR REGISTER !")

      var checkAlreadyExist = await userModel.findOne({"email": userInfos.email})

      if (checkAlreadyExist) {

        res.status(409).send({message: "user already exists"}) 

      }
      else {

          var crypted_passwd = bcrypt.hashSync(userInfos.password, 1);
          const image = (userInfos.image === undefined) ? "default.jpg" :  userInfos.image


          var newUser = {

            '_id':  new ObjectID(), //Give temporary objectId before getting the one generated
            "username": userInfos.username, 
            "email": userInfos.email,
            "password": crypted_passwd,
            "profilePicture": image,
            "carPlate": userInfos.carPlate,
            "solde": 100,
            "reservations": [],
            "isBlocked": false,
            "isAdmin": false,
            "online": false,
            "emailConfirmed": false
          }
       
           userModel.create(newUser, function(err, res) {
              if (err) throw err;
              
            })

            //Send account created
            res.status(200).send([{message: "Success ! Please confirm your email"},{_id: newUser._id, username: newUser.username, email: newUser.email}])

            //EMAIL SMTP

            // async..await is not allowed in global scope, must use a wrapper
            //async function main() {
              // Generate test SMTP service account from ethereal.email
              // Only needed if you don't have a real mail account for testing
              let testAccount = await nodemailer.createTestAccount(); 

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
                to: newUser.email, // list of receivers
                subject: "You're almost there 🚗✔", // Subject line
                text: "Please confirm your email", // plain text body
                html: `<h1>Welcome ${newUser.username} !</h1>
                      <h3 style="color:grey">Please confirm your email</h3>
                      <img style="height:375px;width:500px" src="https://image.freepik.com/vecteurs-libre/mot-bienvenue-personnages-dessins-animes_81522-4207.jpg"> 
                      <br>
                      <br>
                      <a href="${process.env.API}/confirmation/${token}" style="width:200px;height:100px">
                        <button type="button" style=" box-shadow: 0 8px 16px 0 rgba(0,0,0,0.2), 0 6px 20px 0 rgba(0,0,0,0.19);background-color: white; color: #0079ca; border-radius: 100%; background: white; border: none; height: 100px;margin-left:205px;font-weight: bold"> Confirm your Email </button>
                      </a>`, // html body
              });

              console.log("Message sent: %s", info.messageId);

      }

    }else{
      res.status(422).send({message: "Error : passwords do not match"}) 
    }

      


  }else{
    res.status(422).send({message: "Error : Missing fields"}) 
  }

})

router.post("/login", jsonParser, async (req, res) => {
  //CHECK USER INFORMATIONS
  console.log(req.body);

  userInfos = req.body;
   
  var userData = await userModel.findOne({"email": userInfos.email})

  

  if (userData) {

      if(bcrypt.compareSync(userInfos.password, userData.password)) {

        if(userData.isBlocked){ //Is user is blocked

          res.status(403).send({message: "Your account is blocked, please contact customer support for any assitance"})
          

        }else if(!userData.emailConfirmed){ //If email is not confirmed

          res.status(403).send({message: "Please confirm your email"})

        }else{
          //MAKE THE USER APPEAR ONLINE
          userData.online = true;
          await userData.save();

          //CREATE JWT TOKEN THAT EXPIRES IN ONE HOUR
          var token = jwt.sign({
            exp: Math.floor(Date.now() / 1000) + (120 * 60),
            data: {
              id: userData._id,
              email: userData.email,
              username: userData.username,
              isAdmin: userData.isAdmin
            }
          }, process.env.TOKEY);

          console.log(token)

          //RETURN THE USER INFORMATIONS WITH SUCCESS CODE
          res.status(200).send({_id: userData._id, username: userData.username, email: userData.email, token: token})
          
        }

          
      }
      else {
        res.status(403).send({message: "password incorrect"})
      }

      
  } else {
    res.status(403).send({message: "user does not exist"})
  }

})

router.post("/logout", [jsonParser,auth , async (req, res) => {
  //CHECK USER INFORMATIONS
  console.log(req.body);

  userInfos = req.body;
   
  var userData = await userModel.findOneAndUpdate({"_id": mongoose.Types.ObjectId(userInfos._id)}, {"online": false})



  if (userData){

    //RETURN THE USER INFORMATIONS WITH SUCCESS CODE
    res.status(200).send({message: "logged out"})

  } 
  else {
    res.status(403).send({message: "logout failed / user is probably already logged out"})
  }

}])


router.get("/online", [jsonParser, adminAuth, async (req, res) => {
    

      var getAllOnlineUsers = await userModel.find({}, { password: 0 } ).where('online').equals(true)

      if (getAllOnlineUsers) {

        res.status(200).send(getAllOnlineUsers) 

      }
      else {

        res.status(500).send({message: "error fetching all users"}) 

      }

}])

router.post("/blockuser", [jsonParser,adminAuth, async (req, res) => {

  console.log(req.body.userId)

  if(req.body.userId){

    var user = await userModel.findOne({_id: req.body.userId});

    console.log(user)

    if(user.isBlocked)  {
      
      user.isBlocked = false

      user.save()

      res.status(200).send({message: "user unBlocked successfully"})

    }else{

      console.log(user)

      user.isBlocked = true

      user.save()

      res.status(200).send({message: "user Blocked successfully"})

    }

  }else{
    res.status(403).send({message: "Please provide a user to block/unblock"})
  }

}]);

router.get("/", [jsonParser,adminAuth, async (req, res) => {
    

        //Token is valid, get all users
        var getAllUsers = await userModel.find({}, { password: 0 }) 

        if (getAllUsers) {

          res.status(200).send(getAllUsers) 

        }
        else {

          res.status(500).send({message: "error fetching all users"}) 

        }
}])

router.post("/addSolde", [jsonParser,auth, async (req, res) => {
  //CHECK USER INFORMATIONS
  console.log(req.body);

  userInfos = req.body;
   
  //var userData = await userModel.findOneAndUpdate({"_id": mongoose.Types.ObjectId(userInfos._id)}, {"online": false})

  if (userInfos._id, userInfos.amount){

    if(userInfos.amount > 250 || userInfos.amount < 0){
      
      res.status(403).send({message: "Please add a valid amount"})

    }else{

      var userData = await userModel.findOneAndUpdate({"_id": mongoose.Types.ObjectId(userInfos._id)}, {$inc:{"solde": userInfos.amount}})

      //RETURN THE USER INFORMATIONS WITH SUCCESS CODE
      res.status(200).send({message: "successfully added "+userInfos.amount+" to your account"})

    }

    

    

  } 
  else {
    res.status(403).send({message: "missing fields"})
  }

}])




module.exports = router;