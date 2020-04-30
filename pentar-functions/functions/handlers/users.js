const {admin, db} = require('../util/admin');

const config = require('../util/config');

const firebase = require('firebase');
firebase.initializeApp(config)

const {validateSignupData, validateLoginData, reduceUserDetails} = require('../util/validators');


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
            return response.status(500).json({general: 'Something went wrong, please try again'});
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

exports.addUserDetails = (request, response) => {
    let userDetails = reduceUserDetails(request.body);
    db.doc(`/users/${request.user.handle}`).update(userDetails)
    .then(()=>{
        return response.status(200).json({message:"Details updated successfully"});
    })
    .catch(err => {
        console.error(err);
        return response.status(500).json({error: err.code});
    })
} 

//Get user details post signin

exports.getAuthenticatedUser = (request,response) => {
    let userData = {};
    db.doc(`/users/${request.user.handle}`).get()
    .then(doc => {
        if(doc.exists){
            userData.credentials = doc.data();
            return db.collection('likes').where('userHandle', '==', request.user.handle).get();
        }
    })
    .then(data => {
        userData.likes =[];
        data.forEach(doc => {
            userData.likes.push(doc.data());
        });
        return db.collection('notifications').where("recipient", '==', request.user.handle)
        .orderBy('createdAt', 'desc').limit(10).get();
    })
    .then(data => {
        userData.notifications = [];
        data.forEach(doc => {
            userData.notifications.push({
                recipient :  doc.data().recipient,
                sender :  doc.data().sender,
                createdAt :  doc.data().createdAt,
                type :  doc.data().type,
                storyId :  doc.data().storyId,
                read :  doc.data().read,
                notificationId : doc.id
            })
        })
        return response.json(userData);
    })
    .catch(err => {
        console.error(err);
        return response.status(500).json({error: err.code})
    })
}

//GetUserDetails

exports.getUserDetails = (request, response) => {
    let userData = {};
    db.doc(`/users/${request.params.handle}`).get()
    .then(doc => {
        if(doc.exists){
            userData.user = doc.data();
            return db.collection('stories').where('handle', '==', request.params.handle )
            .orderBy('createdAt', 'desc')
            .get()
        } else {
            return response.status(404).json({error: "User not found"});
        }
    })
    .then(data => {
        userData.stories = [];
        data.forEach(doc => {
            userData.stories.push({
                body: doc.data().body,
                createdAt: doc.data().createdAt,
                likeCount: doc.data().likeCount,
                commentCount: doc.data().commentCount,
                userImage: doc.data().userImage,
                handle: doc.data().userHandle,
                storyId: doc.id
            })
        })
        return response.json(userData);
    })
    .catch(err => {
        console.error(err);
        return response.json(500).json({error: err.code});
    })
}


//MarkNotificationsRead

exports.markNotificationsRead = (request, response) => {
    let batch = db.batch();
    request.body.forEach(notificationId => {
        const notification = db.doc(`/notifications/${notificationId}`);
        batch.update(notification, { read: true});
    })
    batch.commit()
    .then(()=>{
        return response.json({message: "Notifications marked read"});
    })
    .catch(err => {
        console.error(err);
        return repsonse.status(500).json({error: err.code});
    })
}