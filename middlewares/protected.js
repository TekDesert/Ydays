const jwt = require('jsonwebtoken');

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

module.exports = {auth}