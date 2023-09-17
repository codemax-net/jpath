# jpath

An intuitive library that enables JS object validation and filtering using native javascript descriptors

## Installation
`npm install git+https://s3.codemax.net/metaxas/jpath.git`

# Example usage
```
const jpath=require('jpath');

const datasetValidator=jpath.valueTest({//should be an object
    '*':{//each entry is a user
        id:jpath.ID(),                          //id is a key (i.e users[someuser.id]==someuser),
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

const dataset={
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

const error=datasetValidator(dataset);
if(error){
    console.log(error);
}else{
    console.log('dataset is valid')
}

```

## Simple value tests
### String    
Expects the value to be a **string**
for example:
  - `valueTest(String)` constructs a value-test function that returns true if it is applied on an string 
  - `valueTest([,,String])` constructs a value test function that returns null if it is applied on  an array of string values, or an error message otherwise.
### Number    
Expects the value to be a **number**
### Boolean   
Expects the value to be either **true** or **false**
### Object    
Expects the value to be an object
### Array     
Expects the value to be an array
### Function  
Expects the value to be a function

## Complex value tests
### Array tests
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


### Object tests
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

## Using regular expressions as value test specifiers
Example:
```
    const fileValidator=valueTest({
        fileName:/^[^\/]+$/,            //valid linux fileName
        fileMods:/^(r|-)(w|-)(x|-)$/    //linux file permissions
    });
    const error=fileValidator({fileName:'my-file',fileMods:'r--'});
    if(error){
        console.log('Invalid file descriptor:',error)
    }else{
        console.log('All good');
    }
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

### jpath.key([pattern])
Expects the value to be an ID property, but does not enforce any changes on the target object  
For example:  
```
    const datasetValidator=valueTest({
        '*':{
            id   : jpath.key(/^obj\d+$/),
            email: jpath.email()
        }
    });
    const dataset={
        'obj1':{
            id   : 'obj2',
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

### jpath.empty([String|Array|Object])
Expects the value to be empty  
Example:  
```
    console.log(jpath.empty(String)('')); //should print 0
    console.log(jpath.empty(String)('foo')); //should print an error message
    
    console.log(jpath.empty(Array)([])); //should print 0
    console.log(jpath.empty(Array)([1,2,3])); //should print an error message

    console.log(jpath.empty(Object)({})); //should print 0
    console.log(jpath.empty(Object)({foo:1})); //should print an error message

    console.log(jpath.empty()([])); //should print 0
    console.log(jpath.empty()('')); //should print 0
    console.log(jpath.empty()({})); //should print 0

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

## Custom value tests
Essentially a value test is a function of the form `(v0,k0,v1,k1,v2,k2,....) => error message or null`  
The parameters of the value test function define the ancestor path of the value v0, i.e.:  
  `v0===v1[k0]`, `v1===v2[k1]`, ... or  
  `v0=vn[kn-1]...[k2][k1][k0]`
### Basic example of a custom value test
In the example below we define a validator for a lookup value using a custom value test:
```
    const datasetValidator=valueTest({
        words:[,,/^\w+$/], //an array of words
        phrases:{
            '*':[,,(word,wordIndex,phraseArray,phraseId,phrases,phrasesId,dataset)=>{//our custom validator
                if(dataset.words.includes(word)){
                    return 0;
                }else{
                    return `The word "${word}" must be one of ${dataset.words.join(',')}`;
                };
            }]
        }
    });

    console.log(datasetValidator({
        words:['car','bike','blue','red','big','small'],
        phrases:{
            'phrase1':['blue','car'], 
            'phrase2':['yellow','boat']
        }
    }));//should print the error message 'The word "yellow" must be one of car,bike,blue,red,big,small' 
```
### Helper functions for writing custom value tests
The following functions can be used to extract the components of the value test arguments 
  - `getKeys`      , returns only the keys k0,k1,... of the arguments 
  - `getPathKeys`  , returns only the keys but in reverse order, i.e. kN-1,...k2,k1,k0
  - `getValues`    , returns only the values v0,v1... 
  - `getPathValues`, returns only the values but in reverse order i.e. vN-1,...v2,v1,v0 
  - `getRoot`      , returns the root value (i.e. the dataset tested)
  - `getPath`      , returns a string describing the path of v0

We can rewrite the previous validator for example as:
```
    const datasetValidator=valueTest({
        words:[,,/^\w+$/], //an array of words
        phrases:{
            '*':[,,(...args)=>{//our custom validator
                const [word,phrase]=jpath.getValues(...args);
                const dataset =jpath.getRoot(...args);
                const wordPath=jpath.getPath(...args);
                if(dataset.words.includes(word)){
                    return 0;
                }else{
                    return `Bad phrase "${phrase.join(' ')}"!\nThe word "${word}"  ${wordPath} must be one of ${dataset.words.join(',')}`;
                };
            }]
        }
    });

    console.log(datasetValidator({
        words:['car','bike','blue','red','big','small'],
        phrases:{
            'phrase1':['blue','car'], 
            'phrase2':['yellow','boat']
        }
    }));//should print the error message 'Bad phrase "yellow boat"! The word "yellow" defined in /phrases/phrase2/0 must be one of car,bike,blue,red,big,small' 
```

## Sealed objects
By default an object validator tests the target object using the defined name/value tests.  
It can be however that we want the validator to return an error if an object contains any property which does not pass validation.  
This can be achieved using the special name filter `jpath.sealed`:  
```
    const normalValidator=valueTest({'x,y':Number});
    const sealedValidator=valueTest({'x,y':Number,[jpath.sealed]:true});

    console.log(normalValidator({x:1,y:2,z:3}));//should print 0
    console.log(sealedValidator({x:1,y:2,z:3}));//should print an error message because the property z does not pass validation
``` 

The value of jpath.sealed can also be a callback function `(notValidatedKeys,v0,k0,v1,k1....)=> error message`:

```
    const sealedValidator=valueTest({
        'x,y':Number,
        [jpath.sealed]:(notValidatedKeys,point)=>{
            console.warn(`The following properties will be deleted:${notValidatedKeys.join(',')}`);
            notValidatedKeys.forEach(key=>delete point[key]);
            console.warn('The object is modified to',point);
            return 0;
        }
    });
    console.log(sealedValidator({x:1,y:2,z:3,type:'3d point'}));
```

## Custom name filters
You can define custom name filters using the helper function `nameFilter`:  

```
    const validator=valueTest({
        [jpath.nameFilter((name,index)=>index==0)]:String,//the first enumerated property should have a string value
        [jpath.nameFilter((name,index)=>index!=0)]:Number,//all the rest should be numbers
    });

    console.log(validator(['a string',1,2,3]));//should print 0
    console.log(validator({name:'a string',x:1,y:2}));//should print 0
    console.log(validator([0,1,2,3]));//should print an error message
    console.log(validator({x:1,y:2,name:'a string'}));//should print an error message
``` 



