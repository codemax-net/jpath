# jpath
## installation
`npm install git+https://s3.codemax.net/metaxas/jpath.git`

# example usage
```
const jpath=require('jpath');

const datasetValidator=jpath.valueTest({//the users is an object
    '*':{//each entry is a user
        id:jpath.ID(),                         //id is a key (i.e users[someuser.id]==someuser),
        email:jpath.email(),                    //email should be a valid email string
        name :jpath.limit(String,4,32),         //name must be a string from 4 to 32 characters        
        isAdmin:jpath.either(undefined,true),   //isAdmin can be either undefined or otherwise true
        inbox:[,,{//the inbox is an array of messages as described here
            sender   :jpath.notEmpty(String),    //sender must be an non-empty string
            timestamp:jpath.isoDate(),           //timestamp must be a valid date
            message  :jpath.either(undefined,jpath.notEmpty(String,1024)),//message can be either undefined, or a string of max 1024 characters
            markedAsRead:Boolean//markedAsRead must be a Boolean
        }]
    }
});

const users={
    'admin':{
        id:'admin',
        email:'foo@bar.com',
        name :'tom tom',
        isAdmin:true,
        inbox:[]
    },
    'mark':{
        id:'mark',
        email:'mark@boo.net',
        name :'mark smith',
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

## simple value tests
### String    
Expects the value to be a **string**
for example:
  - `valueTest(String)` constructs a value-test function that returns true if it is applied on an string 
  - `valueTest([,,String])` constructs a value test function that returns null if it is applied on  an array of string values, or an error message otherwise.
### Number    
Expects the value to be a **number**
### Boolean   
expects the value to be either **true** or **false**
### Object    
expects the value to be an object
### Array     
expects the value to be an array
### Function  
expects the value to be a function

## Complex value tests
### matching arrays
An array literal that starts with two empty items i.e. `[,,X]` defines an array that all its items are valid X  (where X is any value test definition)
Example:
```
    const dataValidator=valueTest([,,String]); 
    const dataset=['hello','world'];
    const error=dataValidator(dataset);
    if(error){
        console.log('something went wrong:',error)
    }else{
        console.log('all is good')
    }
```

Any other array literal defines an array that should match each defined test
Example:
```
    const tableRowValidator=valueTest([String,Number,String]);
    const error=tableRowValidator(['a string',42,'another string']);
    if(!error){
        console.log('all is good')
    }else{
        throw new Error(error);
    };
```


### matching objects
An object literal defines an object validator
Example:
```
    const pointDef={x:Number,y:Number};
    const rectDef ={
        topLeft     :pointDef,
        bottomRight :pointDef
    };
    const rectValidator=valueTest(rectDef);
    const rect={topLeft:{x:0,y:0},bottomRight:{x:10,y:10}};
    const error=rectValidator(rectDef)(rect);
    console.log(error);

```

The following property names of the object can be used to define name filters for the target object:
  - `"*"`       defines a name filter that matches all the properties of the target object
  - `"a,b,c"`   defines a name filter that matcjes the properties a, b and c
  - `"^a,b,c"`  defines a name filter that matches all the properties of the target object  except a, b, and c
  - `"/a|b|c/"` defines a name filter that matches all the properties of the target object described by the regular expression /a|b|c/
  - a backslash in the begining of the key is an escape character  
    e.g. `"\*"` defines the property "*", and  `"\foo,bar"` defines the property "foo,bar" 
Example:
```
    const validator=valueTest({
        '*': {// all the properties of the test object should be objects
            '\*' :String, //having a string property named "*"
            'a,b':Number, //and the properties a and b with number values
        }
    });
    const error=validator({
        foo:{
            "*" : 'hello',
            a   : 1,
            b   : 2
        },
        bar:{
            "*" : 'jpath',
            a   : 0,
            b   : 'this is not a number'
        }
    });
    if(error){
        console.log('the object does not match the validator. Error:', error);
    };
```

## Special type tests
### jpath.email([strict])
Expects the value to be a valid email. When strict is truish then a more strict validation method is used
For example:
```
    const emailTest=valueTest({
        name    :String,
        email   :jpath.email()
    });
    const strictMailTest=valueTest({
        name    :String,
        email   :jpath.email('strict')
    });
    console.log(emailTest({name:'foo',email:'foo@b^ar.com'}));//should print 0, 
    console.log(strictMailTest({name:'foo',email:'foo@b^ar.com'}));//should print an error message

```
### jpath.phone()
Expects the value to be a valid phone number.

### jpath.isoDate()
Expects the value to be a valid iso date string

### jpath.ID()
Forces the value to be an ID property.
For example:
```
    const datasetValidator=valueTest({
        '*':{
            id   : jpath.ID(),
            email: jpath.email()
        }
    });
    const dataset={
        'tom':{
            email: 'tom@foo.bar'
        }
    };
    const error=datasetValidator(dataset);
    console.log(error);//should print 0
    console.log(dataset.tom);//should print "{ email: 'tom@foo.bar', id: 'tom' }"
```

### jpath.key()
Expects the value to be an ID property, but does not enforce any changes on the target object
For example:
```
    const datasetValidator=valueTest({
        '*':{
            id   : jpath.key(),
            email: jpath.email()
        }
    });
    const dataset={
        'tom':{
            id   : 'timTamTom'
            email: 'tom@foo.bar'
        }
    };
    const error=datasetValidator(dataset);
    console.log(error);//should print an error message ("/tom/id must be an identity property")
```

## Composite value tests
### jpath.either(a,b,c,...)
Expects any of the defined tests to validate the target 
Example:
```
    const validator=valueTest({
        'name': jpath.either(undefined, String, {first:String,last:String})
    });
    console.log(validator({name:'a string'}));//should print 0
    console.log(validator({name: undefined}));//should also print 0
    console.log(validator({name: {first:'foo',last:'bar'}}));//should print 0
    console.log(validator({name: 42}));//should print an error message
```

### jpath.all(a,b,c,...)
Expects all of the defined tests to validate the target
Example:
```
    const validateMatrix=jpath.all(Array(3),[,,jpath.all([,,Number])]);//defines a 3x3 matrix
    console.log(validateMatrix([[0,1,2],[3,4,5],[6,7,8]]));//should print 0
    console.log(validateMatrix([[0,1,2],[3,4,5]]));//should print an error message
```

### jpath.empty([String|Array])
Expects the value to be empty
Example
```
    console.log(jpath.empty(String)('')); //should print 0
    console.log(jpath.empty(String)('foo')); //should print an error message
    
    console.log(jpath.empty(Array)([])); //should print 0
    console.log(jpath.empty(Array)([1,2,3])); //should print an error message

    console.log(jpath.empty()([])); //should print 0
    console.log(jpath.empty()('')); //should print 0

```

### jpath.notEmpty(pattern,[maxLength])
Expects a not empty value that matches the pattern
When maxLength is defined the value should have at most maxLength items
For example:
 - `jpath.notEmpty(String,10)`  defines a not empty string of 10 characters at most
 - `jpath.notEmpty([,,Number],10)` defines a not empty array of 10 numbers at most

### jpath.limit(pattern,[min],max)
Expects a value within the defined boundaries
For example:
 - `jpath.limit(String,2,10)`  defines a string from 2 to 10 characters
 - `jpath.limit([,,Number],10)` defines an array of at most 10 numbers
 - `jpath.limit(Number,-10,10)`  defines a number from -10 to 10

