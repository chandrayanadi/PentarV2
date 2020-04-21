const functions = require('firebase-functions');
const app = require('express')();
const { getAllStories, postOneStory, getOneStory, commentOnStory} = require('./handlers/stories');
const { signup, login, uploadImage, addUserDetails, getAuthenticatedUser } = require('./handlers/users');
const FBAuth = require('./util/fbAuth');

//Stories routes
app.get('/getStories', getAllStories);
app.post('/addStory', FBAuth, postOneStory);
app.get('/getStory/:storyId', getOneStory);

//TODO: Like a story
//TODO: Unlike a story
//Comment on a story
app.post('/getStory/:storyId/comment', FBAuth, commentOnStory);

//TODO: Delete a story
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

//Using express to pass App as an argument for routing

exports.api = functions.region('asia-east2').https.onRequest(app);

/*To enable rest/spread operator and async/await syntax, this is what i did:
Check if firebase-functions version is 2.0.0 or higher.
Check if firebase-tools version is 4.0.0 or higher.
Lastly, add "engines":{"node":"8"} inside functions/package.json */
