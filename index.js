// gtravel637@gmail.com

const express = require('express');
const { getMaxListeners } = require('process');
const app = express();
const cors = require("cors")
const bodyParser = require('body-parser')
const { MongoClient, ServerApiVersion, ReturnDocument, ObjectId } = require('mongodb');
const admin = require("firebase-admin");
const { getAuth } = require('firebase-admin/auth');
const serviceAccount = require("./firebaseConfig/travel-guru-c2fc8-firebase-adminsdk-34t1y-cfcdabc1a2.json");
const fileUpload = require('express-fileupload');
const fs = require('fs-extra');
const { Console } = require('console');
require('dotenv').config();

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const port = process.env.PORT || 7000 ;
const uri = `mongodb+srv://saimon:${process.env.MONGODB_PASSWORD}@cluster0.0la8l.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
app.use(cors())
app.use(bodyParser.json())
app.use(fileUpload());


app.get("/", (req, res) => {
    res.send("we are online now")
})


client.connect(err => {
    const collection = client.db(`${process.env.MONGODB_USER_DATABASE_NAME}`).collection(`${process.env.MONGODB_USER_DATABASE_COLLECTIO_NAME}`);
    const roomCollection = client.db(`${process.env.MONGODB_ROOMS_DATABASE_NAME}`).collection(`${process.env.MONGODB_ROOMS_BATABASE_COLLECTION}`);


    app.post("/addUser", (req, res) => {
        collection.find({ uid: req.body.user.uid })
            .toArray((err, document) => {
                if (document.length === 0 && req.body.user.uid) {
                    collection.insertOne(req.body.user)
                        .catch(data => console.log("sucessfully insart in database"))
                }
            })
    })

    app.get("/getUser", (req, res) => {
        const Bearer = req.headers.authorization

        if (Bearer && Bearer.startsWith("Bearer ")) {
            const idToken = Bearer.split(" ")[1]

            getAuth().verifyIdToken(idToken)
                .then((decodedToken) => {
                    const uid = decodedToken.uid;

                    if (uid) {
                        collection.find({ uid: uid })
                            .toArray((err, document) => {
                                res.send(document[0])
                            })
                    }
                })
                .catch((error) => {

                });
        }

    })

    app.post("/addRooms", (req, res) => {
        const image = req.files.image
        const roomInfo = {
            name: req.body.name,
            bedRoom: req.body.bedRoom,
            bed: req.body.bed,
            price: req.body.price,
            rating: req.body.rating,
            wifi: req.body.wifi,
            airCondition: req.body.airCondition,
            Kitchen: req.body.Kitchen,
            Cancellation: req.body.Cancellation,
            location: req.body.location
        }
        const encodedImage = image.data.toString('base64');
        const img = {
            contentType: image.mimetype,
            size: image.size,
            data: Buffer.from(encodedImage, 'base64')
        }

        roomCollection.insertOne({ ...roomInfo, image: img })
            .then(data => {
                if (data.insertedId) {
                    res.send(data.insertedId)
                }
            })
    })
    app.get("/getRooms", (req, res) => {
        const locationName = req.headers.location
        roomCollection.find({ location: locationName })
            .toArray((err, document) => {
                res.send(document)
            })
    })
    app.get("/getRoomsInfo", (req, res) => {
        roomCollection.find({})
            .toArray((err, document) => {
                res.send(document)
            })
    })

    app.get("/editRoom", (req, res) => {
        const roomID = req.headers.roomid
        roomCollection.find({ _id: ObjectId(roomID) })
            .toArray((err, document) => {
                res.send(document[0])
            })
    })

    app.post("/updateRoom", (req, res) => {
        const image = req.files.image
        const roomInfo = {
            name: req.body.name,
            bedRoom: req.body.bedRoom,
            bed: req.body.bed,
            price: req.body.price,
            rating: req.body.rating,
            wifi: req.body.wifi,
            airCondition: req.body.airCondition,
            Kitchen: req.body.Kitchen,
            Cancellation: req.body.Cancellation,
            location: req.body.location
        }
        const encodedImage = image.data.toString('base64');
        const img = {
            contentType: image.mimetype,
            size: image.size,
            data: Buffer.from(encodedImage, 'base64')
        }
        roomCollection.updateOne({ _id: ObjectId(req.body._id) },
            {
                $set: {
                    ...roomInfo, image: img
                }
            })
            .then(result => {
                if (result.matchedCount > 0) {
                    res.send(true)
                }
            })
    })

    app.delete("/deleteItem", (req, res) => {
        const roomId = req.headers.roomid
        roomCollection.deleteOne({ _id: ObjectId(roomId) })
            .then(result => {
                res.send(result.deletedCount > 0)
            })
    })
    app.put("/addBookingInfo", (req, res) => {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const date = new Date().toLocaleDateString("en-US", options)
        const time = new Date().toLocaleTimeString();
        const bookingTime = `${date} ${time}`
        const bookingInfo = { ...req.body, bookingTime }
        collection.updateOne({ uid: req.body.uid }, { $push: { allBooking: {$each: [bookingInfo], $position:0} } }, { upsert: true })
            .then(result => {
                if (result.modifiedCount > 0) {
                    res.send(result.modifiedCount > 0)
                }
            })

    })

});


app.listen( port )
