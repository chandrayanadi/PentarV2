const functions = require('firebase-functions');
const app = require('express')();
const { getAllStories, postOneStory, getOneStory, commentOnStory, likeStory, unlikeStory, deleteStory } = require('./handlers/stories');
const { signup, login, uploadImage, addUserDetails, getAuthenticatedUser, getUserDetails, markNotificationsRead } = require('./handlers/users');
const FBAuth = require('./util/fbAuth');
const {db} = require('./util/admin');

//Stories routes
app.get('/getStories', getAllStories);
app.post('/addStory', FBAuth, postOneStory);
app.get('/getStory/:storyId', getOneStory);

//Like, unlike, delete and comment on a story
app.get('/getStory/:storyId/like', FBAuth, likeStory);
app.get('/getStory/:storyId/unlike', FBAuth, unlikeStory);
app.post('/getStory/:storyId/comment', FBAuth, commentOnStory);
app.delete('/getStory/:storyId', FBAuth, deleteStory);

//TODO: Ask to contribute
//TODO: See Variants
//TODO: Make an E Book
//TODO: Publish a story

//Users routes
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image', FBAuth, uploadImage);
app.post('/user/', FBAuth, addUserDetails);
app.get('/user/', FBAuth, getAuthenticatedUser);
app.get('/user/:handle', getUserDetails);
app.post('/notifications', FBAuth, markNotificationsRead);

//Using express to pass App as an argument for routing

exports.api = functions.region('asia-east2').https.onRequest(app);

exports.createNotificationOnLike = functions.region('asia-east2').firestore.document('likes/{id}')
.onCreate((snapshot) => {
    db.doc(`/stories/${snapshot.data().storyId}`).get()
    .then((doc) => {
        if(doc.exists){
            return db.doc(`/notifications/${snapshot.id}`).set({
                createdAd: new Date().toISOString(),
                recipient: doc.data().handle,
                sender: snapshot.data().userHandle,
                type: 'like',
                read: false,
                storyId: doc.id
            })
        }
    })
    .then(()=>{
        return;
    })
    .catch(err => {
        console.log(err);
        return;
    })
})

exports.deleteNotificationOnUnlike = functions.region('asia-east2').firestore.document('likes/{id}')
.onDelete((snapshot) => {
    db.doc(`/notifications/${snapshot.id}`)
    .delete()
    .then(()=>{
        return;
    })
    .catch(err => {
        console.log(err);
        return;
    })
})


exports.createNotificationOnComment = functions.region('asia-east2').firestore.document('comment/{id}')
.onCreate((snapshot) => {
    db.doc(`/stories/${snapshot.data().storyId}`).get()
    .then((doc) => {
        if(doc.exists){
            return db.doc(`/notifications/${snapshot.id}`).set({
                createdAd: new Date().toISOString(),
                recipient: doc.data().handle,
                sender: snapshot.data().userHandle,
                type: 'comment',
                read: false,
                storyId: doc.id
            })
        }
    })
    .then(()=>{
        return;
    })
    .catch(err => {
        console.log(err);
        return;
    })
})