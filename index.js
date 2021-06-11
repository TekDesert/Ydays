const express = require('express');
const app = express();

const dotenv = require("dotenv");
dotenv.config();

const mongoose = require('mongoose');
mongoose.connect(process.env.DATABASE, {useNewUrlParser: true, useUnifiedTopology: true});

const cors = require('cors')
app.use(cors())

const usersRouter = require('./routes/userRoute');
const reservationRouter = require('./routes/reservationRoute');
const confirmationRouter = require('./routes/confirmationRoute');
const parkingRouter = require('./routes/parkingRoute');
app.use('/user', usersRouter)
app.use('/reservation', reservationRouter)
app.use('/confirmation', confirmationRouter)
app.use('/parking', parkingRouter)



app.listen(
    process.env.PORT,
    () => console.log(`server live on http://localhost:${process.env.PORT}`)
)

