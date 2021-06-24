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
    "carPlate": "123ABC56",
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

addSolde

```http
POST /user/addSolde

protected
```

```js
{
    "_id": "userId",
    "amount": "50"
}
```


Logout User

```http
POST /user/logout

protected
```

```js
{
    "_id": "john@domain.com" //id of the user to logout
}
```

Block User

```http
POST /user/blockuser

protected
Admin only
```

```js
{
    "userId": "60c34814b4a9d307e8dee89d" //id of the user to block
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
Admin only
```


## Reservations

Retrieve all reservations with optional filters

```http
GET /reservation?parking=id&arrivalDate=date

Protected
Admin only
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
	"parkingId": "60c37f62bb22bd3fc8a75be6",
    "arrivalDate":"2021-10-05",
    "departureDate":"2021-11-05",
    "carPlate": "552dasdka85",
	"parkingSpot": "A5"
}
```

Cancel a reservation for a user

```http
PUT /reservation/cancel/<reservationId>

Protected
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

Send contact us email query

```http
POST /confirmation/contactus
```

```js
{
    "name":"Tekdesert",
	"email": "samy.simon@ynov.com",
    "phone":"0658654321",
    "message":"i want help with my account, it's been blocked !"
}
```



## Parkings

Add a new Parking

```http
POST /parking

Protected
Admin only
```

```js
{
    "name": "JurassicPark",
    "description": "my park",
    "coord": [1,25],
    "image": "yes.jpg", //Optional
    "capacity": 15
}
```

Delete a Parking

```http
DELETE /parking/parkingId

Protected
Admin only
warning: this deletes all reservations linked to this parking
```


