const jwt = require('jsonwebtoken');

const axios = require('axios');
const mongoose = require('mongoose');
const parkingModel = require("../models/parkings")

const auth = (req, res, next) =>{

  var autorisation = req.headers["authorization"]

  if(autorisation){
    //user is authorized (protected route)
    bearer = autorisation.split(' '); //remove "Bearer" before token 

    autorisation = bearer[1];
       

    jwt.verify(autorisation, process.env.TOKEY, async function(err, decoded) {

      if(err){
        //There is an error in the token
        res.status(403).send({message: "Authorization token is invalid"})
      }else{

        next()

      }

    });

    

  }else{
    res.status(403).send({message: "Missing Autorisation token"})
  }
  
}

const updateIOT = async (req, res, next) =>{
  //Fetch IOT spot
  
  console.log("executed !")

  await axios
  .get(
    'http://192.168.1.102:80', //IOT Arduino API address
    { timeout: 2000 } //Time out after 3 seconds (IOT is probably turned off passed that point)
  )
  .then(async (response) => {

    console.log("here")
    console.log(response.data)
    //Get IOT element status
    res.locals.IOT_ID = response.data.id //response.data.id
    res.locals.IOT_DEVICEON = 1
    res.locals.IOT_STATUS = response.data.status
    res.locals.IOT_spotName = response.data.spotName
    res.locals.IOT_parkingID = mongoose.Types.ObjectId(response.data.parkingId); //Replace with IOT device parking id

    updatedParking =  await parkingModel.findOne({_id: res.locals.IOT_parkingID})

    if(updatedParking){

      if(res.locals.IOT_STATUS){ //if spot appears to be taken

        //Search our list of parking spot for the one we canceled our reservation for
        for (let i = 0; i < updatedParking.emptySpots.length; i++) {
  
          //keep current loop spot saved
          currentSpot = updatedParking.emptySpots[i]
          parkingPlacePosition = -1
          
          //We found the spot to make appear as occupied
          if(currentSpot.spotName === res.locals.IOT_spotName){
            //Make spot appear taken          
            updatedParking.emptySpots[i].isOccupied = 1
            updatedParking.save()
  
            break;
          }
        }
  
        console.log("Car parked !, updating parking...")

        next()
  
      }else{
        console.log("Spot is empty !")

        //Search our list of parking spot for the one we canceled our reservation for
        for (let i = 0; i < updatedParking.emptySpots.length; i++) {
  
          //keep current loop spot saved
          currentSpot = updatedParking.emptySpots[i]
          parkingPlacePosition = -1
          
          //We found the spot to Make appear as not occupied
          if(currentSpot.spotName === res.locals.IOT_spotName){
            //Make spot appear empty
            updatedParking.emptySpots[i].isOccupied = 0
            updatedParking.save()
  
            break;
          }
        }

        next()
      }

    }else{
      res.status(403).send({message: "Error updating IOT : parking is not existant"})
    }
  })
  .catch(async(error) => {
    console.log(error.code)
    console.log("HEEEERE")

    //Get IOT element status
    res.locals.IOT_ID = 1 //response.data.id
    res.locals.IOT_DEVICEON = 0 //device is off
    res.locals.IOT_STATUS = 0
    res.locals.IOT_spotName = "A1"
    res.locals.IOT_parkingID = mongoose.Types.ObjectId("60ce49e33ba9e8029cc4712b"); //Replace with IOT device parking id

    updatedParking =  await parkingModel.findOne({_id: res.locals.IOT_parkingID})

    //Search our list of parking spot for the one we canceled our reservation for
    for (let i = 0; i < updatedParking.emptySpots.length; i++) {
  
      //keep current loop spot saved
      currentSpot = updatedParking.emptySpots[i]
      parkingPlacePosition = -1
      
      //We found the spot to Make appear as not occupied
      if(currentSpot.spotName === res.locals.IOT_spotName){
        //Make spot appear empty
        updatedParking.emptySpots[i].isOccupied = 0
        updatedParking.save()

        break;
      }
    }

    next()

 
  })
}

const adminAuth = (req, res, next) =>{

  var autorisation = req.headers["authorization"]

  if(autorisation){
    //user is authorized (protected route)
    bearer = autorisation.split(' '); //remove "Bearer" before token 

    autorisation = bearer[1];
       

    jwt.verify(autorisation, process.env.TOKEY, async function(err, decoded) {

      if(err){
        //There is an error in the token
        res.status(403).send({message: "Authorization token is invalid"})
      }else{

        confirmedAdmin = jwt.decode(autorisation).data.isAdmin

        if(confirmedAdmin){

        next()

        }else{
          res.status(403).send({message: "Access forbidden to non-Admins"})
        }

      }

    });

    

  }else{
    res.status(403).send({message: "Missing Autorisation token"})
  }
  
}

module.exports = {auth,adminAuth,updateIOT}