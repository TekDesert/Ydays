var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser') //use to get req.body

const formModel = require("../models/reservations")

const bcrypt = require("bcrypt");

var ObjectID = require('mongodb').ObjectID;

var mongoose = require('mongoose');

const app = express();
app.use(express.json())


// create application/json parser
var jsonParser = bodyParser.json()

router.post("/", jsonParser, async (req, res) => {
    
    
  userInfos = req.body;

  console.log("Saving your Reservation... : \n" )

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
            "online": false

          }
       
           userModel.create(newUser, function(err, res) {
              if (err) throw err;
              
            })

         res.status(200).send([{message: "success"},{_id: newUser._id, username: newUser.username, email: newUser.email}])
      }


  }else{
    res.status(422).send({message: "missing fields"}) 
  }

})


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