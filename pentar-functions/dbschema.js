let db = {
    stories:[
        {
            handle: 'user',
            body:' body of story',
            createdAt: 'date in iso format',
            likeCount: '200',
            commentCount: '100',
            contributionRequest: '13',
            publisherInterest: '1',
            versions: '2'
        }
    ]
}

const userDetails = {
    credentials :{
        userId:"",
        email:"",
        handle:"",
        createdAt:"",
        location:"",
        imageURL:"",
        bio:"",
        website:""
    },
    likes:[
        {
            userHandle:"",
            storyID:"",
        },
        {
            userHandle:"",
            storyID:""
        }
    ]
};