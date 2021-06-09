const express = require('express');
const app = express();

const dotenv = require("dotenv");
dotenv.config();

const mongoose = require('mongoose');
mongoose.connect(process.env.DATABASE, {useNewUrlParser: true, useUnifiedTopology: true});

var cors = require('cors')
app.use(cors())

var usersRouter = require('./routes/userRoute');
var formRouter = require('./routes/reservationRoute');
app.use('/user', usersRouter)
app.use('/form', formRouter)



app.listen(
    process.env.PORT,
    () => console.log(`server live on http://localhost:${process.env.PORT}`)
)

