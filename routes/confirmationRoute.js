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


module.exports = router;