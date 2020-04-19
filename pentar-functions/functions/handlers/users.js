const {admin, db} = require('../util/admin');

const config = require('../util/config');

const firebase = require('firebase');
firebase.initializeApp(config)

const {validateSignupData, validateLoginData} = require('../util/validators');


exports.signup = (request, response) => {
    const newUser = {
        email: request.body.email,
        password: request.body.password,
        confirmPassword: request.body.confirmPassword,
        handle: request.body.handle
    }

    const { valid, errors } = validateSignupData(newUser);

    if(!valid) {
        return response.status(400).json(errors);
    }

    const blank = 'blank.png';

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
            imageURL: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${blank}?alt=media`,
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
}


exports.login = (request, response) => {
    const user = {
        email: request.body.email,
        password: request.body.password
    }
    
    const {valid, errors} = validateLoginData(user);
    
    if(!valid) {
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
}

exports.uploadImage = (request, response) => {
    const BusBoy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');

    const busboy = new BusBoy({headers: request.headers});

    let imageFileName;
    let imageToBeUploaded = {};

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {

        if(mimetype !== 'image/jpeg' && mimetype !== 'image/png'){
            return response.erros(500).json({error: "wrong file type submitted, submit a JPEG or a PNG file please"});
        }
        
        console.log(fieldname);
        console.log(filename);
        console.log(mimetype);

        const imageExtension = filename.split('.')[filename.split('.').length - 1];
        imageFileName = `${Math.round(Math.random()*100000000000)}.${imageExtension}`;
        const filepath = path.join(os.tmpdir(), imageFileName);
        imageToBeUploaded = {filepath, mimetype};

        file.pipe(fs.createWriteStream(filepath)); //Create the file
    })
    busboy.on('finish', () => {
        admin.storage().bucket().upload(imageToBeUploaded.filepath, {
            resumable: false,
            metadata: {
                metadata:{
                    contentType: imageToBeUploaded.mimetype
                }
            }
        })
        .then(() => {
            const imageURL = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media` //alt media helps to show the file on the browser instead of just downloading it to our computer
            return db.doc(`/users/${request.user.handle}`).update({imageURL});
        })
        .then(() => {
            return response.status(203).json({message: "Image uploaded successfully"});
        })
        .catch(err => {
            console.error(err);
            return response.status(500).json({error: err.code});
        })
    })
    busboy.end(request.rawBody);
}