var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser') //use to get req.body

const userModel = require("../models/users")

const bcrypt = require("bcrypt");

var ObjectID = require('mongodb').ObjectID;

var mongoose = require('mongoose');

const app = express();
app.use(express.json())

const jwt = require('jsonwebtoken');

const { auth } = require("../middlewares/protected");
// create application/json parser
var jsonParser = bodyParser.json()

router.post("/", jsonParser, async (req, res) => {
    
    
  userInfos = req.body;

  console.log("Registering user.... : \n" )

  console.log(req.body)


  if(userInfos.username &&  userInfos.email && userInfos.password) {

      console.log("GOOD FOR REGISTER !")

      var checkAlreadyExist = await userModel.findOne({"email": userInfos.email})

      if (checkAlreadyExist) {

        res.status(409).send({message: "user already exists"}) 

      }
      else {

          var crypted_passwd = bcrypt.hashSync(userInfos.password, 1);


          var newUser = {

            '_id':  new ObjectID(), //Give temporary objectId before getting the one generated
            "username": userInfos.username, 
            "email": userInfos.email,
            "password": crypted_passwd,
            "profilePicture": "default.jpg",
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

         res.status(200).send([{message: "Success ! Please confirm your email"},{_id: newUser._id, username: newUser.username, email: newUser.email}])
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

          res.status(403).send({message: "user is Blocked"})
          

        }else if(userData.emailConfirmed){ //If email is not confirmed
          res.status(403).send({message: "Please confirm your email"})
        }else{
          //MAKE THE USER APPEAR ONLINE
          userData.online = true;
          await userData.save();

          //CREATE JWT TOKEN THAT EXPIRES IN ONE HOUR
          var token = jwt.sign({
            exp: Math.floor(Date.now() / 1000) + (120 * 60),
            data: 'foobar'
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

router.post("/logout", jsonParser, async (req, res) => {
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

})


router.get("/online", jsonParser, async (req, res) => {
    

      var getAllOnlineUsers = await userModel.find({}, { password: 0 } ).where('online').equals(true)

      if (getAllOnlineUsers) {

        res.status(200).send(getAllOnlineUsers) 

      }
      else {

        res.status(500).send({message: "error fetching all users"}) 

      }

})

router.get("/", [jsonParser,auth, async (req, res) => {
    

        //Token is valid, get all users
        var getAllUsers = await userModel.find({}, { password: 0 }) 

        if (getAllUsers) {

          res.status(200).send(getAllUsers) 

        }
        else {

          res.status(500).send({message: "error fetching all users"}) 

        }

     
  

}])


module.exports = router;