const functions = require("firebase-functions");
// if user actions needed
const admin = require('firebase-admin');
admin.initializeApp();

// data to write on the DB it can be send with the request
const food = { "foodName": "Chicken_Taco", "foodType": "Taco", "protein": "chicken", "calories": 700 };
const pepsi = { "drinkName": "Large Pepsi", "calories": 300, "size": 24 };
const coke = { "drinkName": "Large Coke", "calories": 410, "size": 32 };

exports.createFirestoreData = functions.https.onRequest(async (req, res) => {
    const writeData = await admin.firestore()
        .collection('foods')
        .doc(food.foodName)
        .set(food);
    // creates document with the food
    res.json(writeData);
});

exports.createDataBaseData = functions.https.onRequest(async (req, res) => {
    // creates document with the drink
    const writeData = await admin.database()
        .ref('drinks/pepsi') // can use coke if you like it more
        .set(pepsi)

    res.send(writeData);
})

// GET request with query "collection" that is "foods" for the example
exports.readFirestoreOnly = functions.https.onRequest(async (req, res) => {

    const collectionQuery = req.query.collection; // foods
    const documentQuery = req.query.doc // Chicken_Taco

    const doc = await admin.firestore().collection(collectionQuery).doc(documentQuery).get();

    if (!doc.exists) {
        res.send("no such document")
    } else {
        res.json(doc.data())
    }

});

// GET request with query "ref" that is "drinks" for the example
exports.readDatabaseOnly = functions.https.onRequest((req, res) => {
    const queryRef = req.query.ref; // drinks

    admin.database().ref(queryRef).once('value', (snapshot) => {
        const data = snapshot.val()
        return res.send(data)
    }).catch(e => {
        res.send(e)
    })

})

exports.createFirestoreAndDatabase = functions.https.onRequest(async (req, res) => {

    const {
        firestoreData,
        databaseData
    } = req.body

    // will receive json (model1) from models folder

    const writeFirestore = await admin.firestore()
        .collection(firestoreData.collection)
        .doc(firestoreData.doc)
        .set(firestoreData.data)

    const writeDatabase = await admin.database()
        .ref(databaseData.ref)
        .set(databaseData.data)

    const promise = Promise.all([writeFirestore, writeDatabase]);

    promise
        .then((resp) => {
            res.send(resp)
        })
        .catch((e) => {
            res.send(e);
        })
})

exports.readFirestoreAndDatabase = functions.https.onRequest(async (req, res) => {

    const {
        collection,
        doc,
        ref
    } = req.query;
    // will receive queries (model2) from models folder
    const responseObject = {};


    const snapshot = await admin.firestore().collection(collection).doc(doc).get();
    if (!snapshot.exists) {
        responseObject['firestore'] = "no such document";
    } else {
        responseObject['firestore'] = snapshot.data()
    }

    await admin.database().ref(ref).once('value', (snapshot) => {
        responseObject['database'] = snapshot.val();
    })




    res.send(responseObject);
})