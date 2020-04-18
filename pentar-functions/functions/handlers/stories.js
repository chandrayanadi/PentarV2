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