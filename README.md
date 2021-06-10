"# Ydays" 
# Foodtastic API

# Table of Content

- Description
- Setup
- Documentation

# Description

Backend for ParkingMeeter, a solution by Tekdesert

## Setup

```bash
# Create a .env file inside the backend directory
# Change hostname and port accordingly
# Mongodb port by default is 27017

PORT=3001
VERSION = 1
APPNAME = "ParkingUser"
DATABASE = "mongodb://localhost:27017/ParkingUser"
TOKEY = "mySecretKey"
API = "http://91fdf464a94d.ngrok.io:80"

```

```bash
npm install # Install all dependencies
```

```bash
# Option 1 - Run the server
nodemon start

# Documentation

## Protected

Must include a bearer token in the authorization header

```http
Authorization: Bearer <token>
```

## User

Register User
a confirmation email will be sent

```http
POST /user
```

```js
{
    "username": "johndoe",
    "email": "john@domain.com",
    "password": "123456",
    "passwordConfirm": "123456",
    "birthDate": "2020-01-03", // Format is important YYYY-MM-DD
    "image": "filename.png" // Optional
}
```

Login User

```http
POST /user/login
```

```js
{
    "email": "john@domain.com",
    "password": "123456"
}
```

Logout User

```http
POST /user/logout
```

```js
{
    "_id": "john@domain.com" //id of the user to logout
}
```

Get all online Users

```http
GET /user/online

Protected
```

Get all Users

```http
GET /user

Protected
```


## Reservations

Retrieve all reservations

```http
GET /reservation

Protected
```

Retrieve a specific user reservation

```http
GET /reservation/user/<userId>

Protected
```

Retrieve reservation dashboard statistics for a user

```http
GET /reservation/user/reservation/<userId>

Protected
```

Make a reservation for a user
A confirmation email with a QR code will be sent

```http
POST /reservation

Protected
```

```js
{
    "userId":"60c1ed58152c951f80399fb4",
    "arrivalDate":"2021-10-05",
    "departureDate":"2021-11-05",
    "carPlate": "552dasdka85",
    "QRCode": "2da53slq"
}
```

## Confirmations

Confirm an email account (done automatically when clicking email link)

```http
GET /confirmation/<confirmationToken>
```

Process QR Code scanning for arrival and parking departure

```http
GET /confirmation/QRValidation/<reservationId>
```


