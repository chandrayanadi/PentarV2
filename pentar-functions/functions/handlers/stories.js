const {db} = require('../util/admin');

//Fetch all stories
exports.getAllStories = (request, response) => {
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
                userHandle: doc.data().userHandle, //Alpha change 1
                createdAt: doc.data().createdAt,
                commentCount: doc.data().commentCount,
                likeCount: doc.data().likeCount,
                userImage: doc.data().userImage
            })
        });
        return response.json(stories)
    })
    .catch(err => console.error(err))
}

//Post one Story
exports.postOneStory = (request, response) => {
    if(request.body.body.trim() === ''){
        return response.status(400).json({error: "Body must not be empty"});
    }

    const newStory = {
        body: request.body.body,
        userHandle: request.user.handle, //Alpha change 2
        userImage: request.user.imageURL,
        createdAt: new Date().toISOString(),
        likeCount: 0,
        commentCount: 0
    };
    db
    .collection('stories')
    .add(newStory)
    .then((doc) => {
        const resStory = newStory;
        resStory.storyId = doc.id;
        response.json(resStory);
    })
    .catch((err) => {
        response.status(500).json({error: 'something went wrong'});
        console.error(err);
    })
}

//Fetch one story
exports.getOneStory = (request, response) => {
    let storyData = {};
    db.doc(`/stories/${request.params.storyId}`)
    .get()
    .then((doc) => {
        if(!doc.exists){
            return response.status(404).json({error: "story not found"});
        }
        storyData = doc.data();
        storyData.storyId = doc.id;
        return db.collection('comments').orderBy('createdAt', 'desc').where('storyId', '==', request.params.storyId).get();
    })
    .then((data)=>{
        storyData.comments =[];
        data.forEach(doc => {
            storyData.comments.push(doc.data());
        })
        return response.json(storyData);
    })
    .catch((err) => {
        console.log(err);
        return response.status(500).json({error: err.code});
    })
}

//Comment on a story
exports.commentOnStory = (request, response) => {
    if(request.body.body.trim() === ''){
        return response.status(400).json({error: "must not be empty"});
    }
    const newComment = {
        body: request.body.body,
        createdAt: new Date().toISOString(),
        storyId: request.params.storyId,
        userHandle: request.user.handle,
        userImage: request.user.imageURL
    };

    db.doc(`/stories/${request.params.storyId}`).get()
    .then((doc) => {
        if(!doc.exists){
            return response.status(400).json({comment: 'Story does not exist'});
        }
        return doc.ref.update({commentCount: doc.data().commentCount + 1 });
    })
    .then(()=>{
        return db.collection('comments').add(newComment)
    })
    .then(() => {
        response.json(newComment);
    })
    .catch((err) => {
        console.log(err);
        response.status(503).json({error: "Something went wrong"});
    })
}

//Like and unlike a Story

exports.likeStory = (request, response) => {
    const likeDocument = db.collection('likes').where("userHandle", '==', request.user.handle).where('storyId', '==', request.params.storyId).limit(1);

    const storyDocument = db.doc(`/stories/${request.params.storyId}`);

    let storyData;

    storyDocument.get()
    .then(doc => {
        if(doc.exists){
            storyData = doc.data();
            storyData.storyId = doc.id;
            return likeDocument.get();
        } else {
            return response.status(404).json ({error: "Story not found"});
        }
    })
    .then(data => {
        if(data.empty){
            return db.collection('likes').add({
                storyId: request.params.storyId,
                userHandle: request.user.handle
            })
            .then(()=>{
                storyData.likeCount++
                return storyDocument.update({ likeCount: storyData.likeCount});
            })
            .then(()=>{
                return response.json(storyData);
            })
        } else {
            return response.json({error: "Story already liked"});
        }
    })
    .catch((err) => {
        response.status(500).json({error: err.code});
    })
}

exports.unlikeStory = (request, response) => {
    const likeDocument = db.collection('likes').where("userHandle", '==', request.user.handle).where('storyId', '==', request.params.storyId).limit(1);

    const storyDocument = db.doc(`/stories/${request.params.storyId}`);

    let storyData;

    storyDocument.get()
    .then(doc => {
        if(doc.exists){
            storyData = doc.data();
            storyData.storyId = doc.id;
            return likeDocument.get();
        } else {
            return response.status(404).json ({error: "Story not found"});
        }
    })
    .then(data => {
        if(data.empty){
            return response.json({error: "Story not liked"});
        } else {
            return db.doc(`/likes/${data.docs[0].id}`)
            .delete()
            .then(()=>{
                storyData.likeCount--
                return storyDocument.update({ likeCount: storyData.likeCount});
            })
            .then(()=>{
                return response.json(storyData);
            })
        }
    })
    .catch((err) => {
        response.status(500).json({error: err.code});
    })
}

//Deleting a story

exports.deleteStory = (request, response) => {
    const document = db.doc(`/stories/${request.params.storyId}`);
    document.get()
    .then((doc) => {
        if (!doc.exists){
            return response.status(404).json({error: "Story not found"});
        }
        if(doc.data().handle !== request.user.handle){ //The stories field has handle and not userHandle as a field
            return response.status(403).json({error: err.code});
        } else {
           return document.delete();
        }
    })
    .then(()=> {
        return response.json({message: "Document deleted"});
    })
    .catch(err => {
        console.error;
        return response.status(500).json({error: err.code});
    })
}