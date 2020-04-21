const {db} = require('../util/admin');

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
                handle: doc.data().handle,
                createdAt: doc.data().createdAt
            })
        });
        return response.json(stories)
    })
    .catch(err => console.error(err))
}

exports.postOneStory = (request, response) => {
    const newStory = {
        body: request.body.body,
        handle: request.user.handle,
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
}

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
            return response.status(400).json({error: 'Story does not exist'});
        }
        return db.collection('comments').add(newComment);
    })
    .then(() => {
        response.json(newComment);
    })
    .catch((err) => {
        console.log(err);
        response.status(503).json({error: "Something went wrong"});
    })
}