const functions = require("firebase-functions");
const app = require("express")();
const {
  getAllStories,
  postOneStory,
  getOneStory,
  commentOnStory,
  likeStory,
  unlikeStory,
  deleteStory,
} = require("./handlers/stories");
const {
  signup,
  login,
  uploadImage,
  addUserDetails,
  getAuthenticatedUser,
  getUserDetails,
  markNotificationsRead,
} = require("./handlers/users");
const FBAuth = require("./util/fbAuth");
const { db } = require("./util/admin");

//Stories routes
app.get("/getStories", getAllStories);
app.post("/addStory", FBAuth, postOneStory);
app.get("/getStory/:storyId", getOneStory);

//Like, unlike, delete and comment on a story
app.get("/getStory/:storyId/like", FBAuth, likeStory);
app.get("/getStory/:storyId/unlike", FBAuth, unlikeStory);
app.post("/getStory/:storyId/comment", FBAuth, commentOnStory);
app.delete("/getStory/:storyId", FBAuth, deleteStory);

//TODO: Ask to contribute
//TODO: See Variants
//TODO: Make an E Book
//TODO: Publish a story

//Users routes
app.post("/signup", signup);
app.post("/login", login);
app.post("/user/image", FBAuth, uploadImage);
app.post("/user/", FBAuth, addUserDetails);
app.get("/user/", FBAuth, getAuthenticatedUser);
app.get("/user/:handle", getUserDetails);
app.post("/notifications", FBAuth, markNotificationsRead);

//Using express to pass App as an argument for routing

exports.api = functions.region("asia-east2").https.onRequest(app);

exports.createNotificationOnLike = functions
  .region("asia-east2")
  .firestore.document("likes/{id}")
  .onCreate((snapshot) => {
    return db
      .doc(`/stories/${snapshot.data().storyId}`)
      .get()
      .then((doc) => {
        if (doc.exists) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAd: new Date().toISOString(),
            recipient: doc.data().handle,
            sender: snapshot.data().userHandle,
            type: "like",
            read: false,
            storyId: doc.id,
          });
        }
      })
      .catch((err) => console.log(err));
  });

exports.deleteNotificationOnUnlike = functions
  .region("asia-east2")
  .firestore.document("likes/{id}")
  .onDelete((snapshot) => {
    return db
      .doc(`/notifications/${snapshot.id}`)
      .delete()
      .catch((err) => {
        console.log(err);
        return;
      });
  });

exports.createNotificationOnComment = functions
  .region("asia-east2")
  .firestore.document("comment/{id}")
  .onCreate((snapshot) => {
    return db
      .doc(`/stories/${snapshot.data().storyId}`)
      .get()
      .then((doc) => {
        if (doc.exists) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().handle,
            sender: snapshot.data().userHandle,
            type: "comment",
            read: false,
            storyId: doc.id,
          });
        }
      })
      .catch((err) => {
        console.log(err);
        return;
      });
  });

exports.onUserImageChange = functions
  .region("asia-east2")
  .firestore.document("users/{userId}")
  .onUpdate((change) => {
    if (change.before.data().imageURL !== change.after.data().imageURL) {
      let batch = db.batch();
      return db
        .collection("stories")
        .where("handle", "==", change.before.data().handle)
        .get()
        .then((data) => {
          data.forEach((doc) => {
            const story = db.doc(`stories/${doc.id}`);
            batch.update(story, { userImage: change.after.data().imageURL });
          });
          return batch.commit();
        });
    } else return true;
  });

  exports.onStoryDelete = functions.region("asia-east2").firestore.document('/stories/{storyId}').onDelete((snapshot,context) => {
      const storyId = context.params.storyId;
      const batch = db.batch();
      return db.collection('comments').where("storyId", '==', storyId).get()
      .then(data => {
          data.forEach(doc => {
              batch.delete(db.doc(`/comments/${doc.id}`));
          })
          return db.collection('likes').where("storyId", "==", storyId).get();
      })
      .then(data => {
        data.forEach(doc => {
            batch.delete(db.doc(`/likes/${doc.id}`));
        })
        return db.collection('notifications').where("storyId", "==", storyId).get();
    })
    .then(data => {
        data.forEach(doc => {
            batch.delete(db.doc(`/notifications/${doc.id}`));
        })
        return batch.commit();
    })
    .catch(err => {
        console.log(err);
    })
  })
