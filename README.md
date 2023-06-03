# jpath
## installation
`npm install git+https://s3.codemax.net/metaxas/jpath.git`

# example usage
```
const jpath=require('jpath');

const datasetValidator=jpath.valueTest({//the users is an object
    '*':{//each entry is a user
        id:jpath.key(),                         //id is a key (i.e users[someuser.id]==someuser),
        email:jpath.email(),                    //email should be a valid email string
        isAdmin:jpath.either(undefined,true),   //isAdmin can be either undefined or otherwise true
        inbox:[,,{//the inbox is an array of messages as described here
            sender      :jpath.notEmpty(String),    //sender must be an non-empty string
            timestamp   :jpath.isoDate(),           //timestamp must be a valid date
            messageBody :String,                    //messageBody must be a string
            markedAsRead:Boolean                    //markedAsRead must be a Boolean
        }]
    }
});

const users={
    'admin':{
        id:'admin',
        email:'foo@bar.com',
        isAdmin:true,
        inbox:[]
    },
    'mark':{
        id:'mark',
        email:'mark@boo.net',
        inbox:[{
            sender:'admin',
            timestamp: new Date().toISOString(),
            messageBody: 'test',
            markedAsRead: false
        }]
    }
}

const error=datasetValidator(users);
if(error){
    console.log(error);
}else{
    console.log('dataset is valid')
}

```
