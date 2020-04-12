const functions = require('firebase-functions');
const admin = require('firebase-admin');
const app = require('express')();

admin.initializeApp();

const firebaseConfig = {
    apiKey: "AIzaSyDvyjPmucaDB9AVX7W9nCX-17isXZRMegc",
    authDomain: "pentar-a77df.firebaseapp.com",
    databaseURL: "https://pentar-a77df.firebaseio.com",
    projectId: "pentar-a77df",
    storageBucket: "pentar-a77df.appspot.com",
    messagingSenderId: "275933265416",
    appId: "1:275933265416:web:17d05a384bf63cb9a4dbbd",
    measurementId: "G-CX5RX1X8L4"
  };

const firebase = require('firebase');
firebase.initializeApp(firebaseConfig);
const db = admin.firestore();


//Get story route
app.get('/getStories', (request, response) =>{
    db
    .collection('stories')
    .orderBy('createdAt', 'desc')
    .get()
    .then((data) => {
        let stories = [];
        data.forEach(doc => {
            stories.push({
                storyID: doc.id,
                body: doc.data().body,
                userHandle: doc.data().userHandle,
                createdAt: doc.data().createdAt
            })
        });
        return response.json(stories)
    })
    .catch(err => console.error(err))
})


//Post story route
app.post('/addStory', (request, response) => {
    const newStory = {
        body: request.body.body,
        userHandle: request.body.userHandle,
        createdAt: new Date().toISOString()
    };
    db
    .collection('stories')
    .add(newStory)
    .then((doc) => {
        response.json({message: `document ${doc.id} created successfully`});
    })
    .catch((err) => {
        response.status(500).json({error: 'something went wrong'});
        console.error(err);
    })
})

//Helper function to validate email

const isEmpty = (string) => {
    if(string.trim() === '') {
        return true;
    }
    else {
        return false;
    }
}

const isEmail = (email) => {
    const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(email.match(emailRegEx)){
        return true;
    }
    else {
        return false;
    }
}


//Sgn up route
app.post('/signup', (request, response) => {
    const newUser = {
        email: request.body.email,
        password: request.body.password,
        confirmPassword: request.body.confirmPassword,
        handle: request.body.handle
    }

    let errors = {}

    //Validate Email

    if(isEmpty(newUser.email)){
        errors.email = 'Must not be empty'
    } else if(!isEmpty(newUser.email)){
        errors.email = 'Must be a valid email'
    }

    //Validate Password

    if(isEmpty(newUser.password)){
        errors.password = 'Cannot be empty'
    }

    //Validate ConfirmPassword

    if(newUser.confirmPassword !== newUser.password){
        errors.confirmPassword = 'Please ensure that both passwords match'
    }

    //Validate Handle

    if(isEmpty(newUser.handle)){
        errors.handle = 'Must not be empty'
    }

    //Ensure no errors

    if(Object.keys(errors).length > 0){
        return response.status(400).json(errors);
    }

    let userId, token;

    db.doc(`/users/${newUser.handle}`).get()
    .then(doc => {
        if(doc.exists){
            return response.status(400).json({handle: "this handle is already taken"});
        } else {
            return firebase
            .auth()
            .createUserWithEmailAndPassword(newUser.email, newUser.password);
        }
    })
    .then(data => {
        userId = data.user.uid;
        return data.user.getIdToken();
    })
    .then((idToken) => {
        token  = idToken;
        const userCredentials = {
            email: newUser.email,
            handle: newUser.handle,
            createdAt: new Date().toISOString(),
            userId
        };
        return db.doc(`/users/${newUser.handle}`).set(userCredentials);
    })
    .then(() =>{
        return response.status(201).json({token});
    })
    .catch (err => {
        console.log(err);
        if (err.code === 'auth/email-already-in-use'){
            return response.status(400).json({email: "email already in use"})
        } else {
            return response.status(500).json({error: err.code});
        }
    })
})

//Login Route

app.post('/login', (request, response) => {
    const user = {
        email: request.body.email,
        password: request.body.password
    }
    
    let errors = {}

    //Validate Email

    if(isEmpty(user.email)){
        errors.email = 'Must not be empty'
    } else if(!isEmail(user.email)){
        errors.email = 'Must be a valid email'
    }

    //Validate Password

    if(isEmpty(user.password)){
        errors.password = 'Cannot be empty'
    }

    //Ensure no errors

    if(Object.keys(errors).length > 0){
        return response.status(400).json(errors);
    }

    firebase.auth().signInWithEmailAndPassword(user.email, user.password)
    .then((data) => {
        return data.user.getIdToken();
    })
    .then(token => {
        return response.json({token})
    })
    .catch(err => {
        console.error(err);
        if(err.code === 'auth/wrong-password'){
            return response.status(403).json({general: "Wrong credentials, please try again"});
        } else {
            return response.status(500).json({error: err.code});
        }
    })
})



//Using express to pass App as an argument for routing

exports.api = functions.region('asia-east2').https.onRequest(app);

/*To enable rest/spread operator and async/await syntax, this is what i did:
Check if firebase-functions version is 2.0.0 or higher.
Check if firebase-tools version is 4.0.0 or higher.
Lastly, add "engines":{"node":"8"} inside functions/package.json */
