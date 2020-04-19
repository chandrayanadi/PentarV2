const functions = require('firebase-functions');
const app = require('express')();
const { getAllStories, postOneStory} = require('./handlers/stories');
const { signup, login, uploadImage } = require('./handlers/users');
const FBAuth = require('./util/fbAuth');

//Stories routes
app.get('/getStories', getAllStories);
app.post('/addStory', FBAuth, postOneStory);

//Users routes
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image', FBAuth, uploadImage);

//Using express to pass App as an argument for routing

exports.api = functions.region('asia-east2').https.onRequest(app);

/*To enable rest/spread operator and async/await syntax, this is what i did:
Check if firebase-functions version is 2.0.0 or higher.
Check if firebase-tools version is 4.0.0 or higher.
Lastly, add "engines":{"node":"8"} inside functions/package.json */
