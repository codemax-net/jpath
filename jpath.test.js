'use strict';
const jpath=require('./jpath');
const {valueTest,valueFilter}=jpath;

const dataset={//sample dataset used for testing 
	"admin":{
		id:"admin",
		email:"admin@foo.bar",
		name :"john",
		isAdmin:true,
		inbox:[
			{
				from:"sales",
				date:"2022-05-12T12:14:37.683Z",
				text:"problem"
			},
			{
				from:"support",
				date:"2022-06-12T16:04:10.120Z",
				text:"problem"
			},
		]
	},
	"sales":{
		id:"sales",
		name :"anna",
		email:"sales@foo.bar"
	},
	"support":{
		id:"support",
		name :"anna",
		email:"sup port@fo/o.bar",
		inbox:[
			{
				from:"john",
				date:"2022-05-12T12:14:37.683Z",
				text:""
			}
		]
	}
};

const FG_RESET 	='\x1b[0m';			
const FG_BLACK 	='\x1b[30m';	//BG 40,  bright fg 90  bright(gray) bg 100
const FG_RED	='\x1b[31m';
const FG_GREEN 	='\x1b[32m';
const FG_YELLOW	='\x1b[33m'	, FG_YELLOW_BRIGHT	='\x1b[93m';
const FG_BLUE  	='\x1b[34m'	, FG_BLUE_BRIGHT	='\x1b[94m';

function assertTrue(title,fn){
	if(!fn){
		fn=title;
		title='';
	};
	const ret=fn();
	console.log('');
	if(title){
		console.log(FG_YELLOW,title);		
	};
	if(!ret){
		console.log(FG_RED,'assertTrue',FG_RESET,fn.toString(), '\n',FG_RED,'failed',FG_RED,ret,FG_RESET);
		process.exit(-1);
	}else{
		console.log(FG_GREEN,'assertTrue',FG_RESET,fn.toString(), '\n',FG_GREEN,'passed',FG_YELLOW_BRIGHT, ret, FG_RESET);
	}
}
function assertFalse(title,fn){
	if(!fn){
		fn=title;
		title='';
	};
	const err=fn();
	console.log('');
	if(title){
		console.log(FG_YELLOW,title);		
	};
	if(err){
		console.log(FG_RED,'assertFalse',FG_RESET,fn.toString(), '\n',FG_RED,'failed',FG_RED,err,FG_RESET);
		process.exit(-1);
	}else{
		console.log(FG_GREEN,'assertFalse',FG_RESET,fn.toString(), '\n',FG_GREEN,'passed',FG_YELLOW_BRIGHT,err,FG_RESET);
	}
}


console.group(FG_YELLOW,'primitive jpath test',FG_RESET);
	assertFalse(()=>valueTest(String)("string")		);
	assertTrue(()=>valueTest(String)(123)			);
	
	assertFalse(()=>valueTest(Number)(123)			);
	assertTrue(()=>valueTest(Number)(null)			);
	
	assertFalse(()=>valueTest(Object)(null)			);
	assertTrue(()=>valueTest(Object)(123)			);
	
	assertFalse(()=>valueTest(Object)({})			);
	assertTrue(()=>valueTest(Object)("string")		);
	
	assertFalse(()=>valueTest(Function)((x)=>x)		);
	assertTrue(()=>valueTest(Function)([])			);
	
	assertFalse(()=>valueTest(Array)([])			);	
	assertTrue(()=>valueTest(Array)(undefined)		);
	
	assertFalse(()=>valueTest(undefined)(undefined)	);
	assertTrue(()=>valueTest(undefined)(null)		);
	
	assertFalse(()=>valueTest(null)(null)			);	
	assertTrue(()=>valueTest(null)(undefined)		);	
console.groupEnd();

console.group(FG_YELLOW,'date, email, phone jpath test',FG_RESET);
	assertFalse(
		()=>valueTest(Date)(new Date().toDateString())
	);
	assertFalse(
		()=>valueTest(Date)(Date.now())
	);	
	assertTrue(
		()=>valueTest(Date)('not a date')
	);	
	
	assertFalse(
		()=>valueTest(jpath.isoDate())(new Date().toISOString())
	);

	assertFalse(
		()=>valueTest(jpath.isoDate())('2020-10-10')
	);

	assertFalse(
		()=>valueTest(jpath.isoDate())('2020-10-10T12:20')
	);

	assertTrue(
		()=>valueTest(jpath.isoDate())('this is not a date')
	);
	
	assertFalse(
		()=>valueTest(jpath.email())('foo@boo.bar')
	);
	assertFalse(
		()=>valueTest(jpath.email('strict'))('foo@boo.bar')
	);
	assertTrue(
		()=>valueTest(jpath.email('strict'))('fo^o@b!oo.bar')
	);
	
	assertFalse(
		()=>valueTest([,,jpath.phone()])(['+11(0123)456 789','+11 (0123)-456-789','+11 0123 456-789','(0123)(456)(789)'])
	);
	assertTrue(
		()=>valueTest(jpath.phone())('not a phone')
	);
console.groupEnd();

assertFalse('dataset is an object of objects',()=>valueTest({'*':{}})(dataset));

assertTrue('every object in the dataset has an id and an email string property',
	()=>valueTest({
		'*':{
			id:String,
			email:String
		}
	})(
		{
			foo:{
				id:123
			},
			bar:{
				email:'a@b.c'
			}
		}
	)
);

console.group(FG_YELLOW,'empty, notEmpty, limit',FG_RESET);
	assertFalse(()=>valueTest(jpath.empty(String))(''));
	assertFalse(()=>valueTest(jpath.empty(Array))([]));
	assertTrue(()=>valueTest(jpath.empty(String))([]));
	assertTrue(()=>valueTest(jpath.empty(Array))(''));
	
	assertFalse(()=>valueTest(jpath.notEmpty(String))('abc'));
	assertFalse(()=>valueTest(jpath.notEmpty(Array))([1,2,3]));
	assertTrue(()=>valueTest(jpath.notEmpty(String))(''));
	assertTrue(()=>valueTest(jpath.notEmpty(Array))([]));	

	assertFalse(()=>valueTest(jpath.notEmpty(String,3))('abc'));
	assertFalse(()=>valueTest(jpath.notEmpty(Array,3))([1,2,3]));
	assertTrue(()=>valueTest(jpath.notEmpty(String,2))('abc'));
	assertTrue(()=>valueTest(jpath.notEmpty(Array,2))([1,2,3]));	

	
	assertFalse(()=>valueTest(jpath.limit(String,1,3))('abc'));
	assertFalse(()=>valueTest(jpath.limit(Array,1,3))([1,2,3]));	
	assertTrue(()=>valueTest(jpath.limit(String,1,2))('abc'));
	assertTrue(()=>valueTest(jpath.limit(Array,1,2))([1,2,3]));		

	assertFalse(()=>valueTest(jpath.limit(String,0,Infinity))(''));
	assertFalse(()=>valueTest(jpath.limit(Array,0,Infinity))([]));
	assertTrue(()=>valueTest(jpath.limit(String,1,Infinity))(''));
	assertTrue(()=>valueTest(jpath.limit(Array,1,Infinity))([]));
	
	assertFalse(()=>valueTest(jpath.limit(String,3))('abc'));
	assertFalse(()=>valueTest(jpath.limit(Array,3))([1,2,3]));	
	assertTrue(()=>valueTest(jpath.limit(String,2))('abc'));
	assertTrue(()=>valueTest(jpath.limit(Array,2))([1,2,3]));		
	
	assertFalse(()=>valueTest(jpath.limit(Number,-3,3))(0));
	assertTrue(()=>valueTest(jpath.limit(Number,0,3))(4));

	assertFalse(()=>valueTest(jpath.limit(Number,3))(2.5));
	assertTrue(()=>valueTest(jpath.limit(Number,))(3.5));
	
	assertFalse(()=>valueTest(jpath.limit(Date,new Date()))(new Date(Date.now()-24*60*60*1000)));
	assertTrue(()=>valueTest(jpath.limit(Date,new Date()))(new Date(Date.now()+24*60*60*1000)));
	assertFalse(()=>valueTest(jpath.limit(Date,Date.now()))(new Date(Date.now()-24*60*60*1000)));
	assertTrue(()=>valueTest(jpath.limit(Date,Date.now()))(new Date(Date.now()+24*60*60*1000)));

	assertFalse(()=>jpath.limit(Date,new Date(),Infinity)(new Date(Date.now()+24*60*60*1000)));
	assertTrue(()=>jpath.limit(Date,new Date(),Infinity)(new Date(Date.now()-24*60*60*1000)));
		
console.groupEnd();

assertFalse('every object in the dataset has an id and an email string property',
	()=>valueTest({
		'*':{
			id:String,
			email:String
		}
	})(dataset)
);

assertFalse(
	()=>valueTest({
		'*':{
			[/id|email/]:String
		},
		'admin':{
			isAdmin:true
		}
	})(dataset)
);

assertFalse(
	()=>valueTest({
		'*':{
			[/id|email/]:String
		}
	})(dataset)
);

assertFalse(
	()=>valueTest({
		'*':{
			id:jpath.key(),
			email:jpath.email(),
			name:jpath.notEmpty(String),
			inbox:jpath.either(undefined,Array)
		}
	})(dataset)
);

assertTrue(
	()=>valueTest({
		'*':{
			id:jpath.key(),
			email:jpath.email(),
			inbox:Array
	}})(dataset)
);

assertFalse(
	()=>valueTest({
		'*':{
			id:jpath.key(),
			email:jpath.email(),
			inbox:jpath.either(undefined,[,,{from:String,text:String}])
		}
	})(dataset)
);

assertTrue(
	()=>valueTest({
		'*':{
			id:jpath.key(),
			email:jpath.email(),
			inbox:jpath.either(undefined,[,,{from:jpath.notEmpty(String),text:jpath.notEmpty(String)}])
	}})(dataset)
);

assertTrue(
	()=>valueTest({
		'*':{
			name:jpath.key()//assuming that "name" should have been an identity property 
		}
	})(dataset)
);


assertFalse(
	()=>valueTest([,,{
			id:jpath.unique(),
			email:jpath.email(),
			inbox:jpath.either(undefined,[,,{from:String,text:String}])
	}])(Object.values(dataset))
);

assertFalse(
	()=>valueTest([{isAdmin:true},{id:'sales'},{id:'support'}])(Object.values(dataset))
);
assertTrue(
	()=>valueTest([{id:'sales'},{id:'support'},{isAdmin:true}])(Object.values(dataset))
);

assertTrue(
	()=>{
		const hasInboxFilter=valueFilter({
				inbox:[,,{from:String,text:String}]
			});
		const usersWithInbox=Object.values(dataset).filter(hasInboxFilter);
		const usersWithoutInbox=Object.values(dataset).filter(jpath.not(hasInboxFilter));
		return (usersWithInbox.length==2) && (usersWithInbox[0]==dataset.admin) && (usersWithoutInbox.length==1);
	}		
);

assertFalse(
	()=>valueTest({
		'*':{
			id:jpath.key(),
			email:jpath.email(),
			inbox:jpath.either(undefined,[,,{
				from:String,
				text:(...args)=>{
					const [text	,message  ,inbox	,user  ,users]=jpath.getValues(...args);
					const [_text,messageIx,_inbox,userId,_users]=jpath.getKeys(...args);
					const root=jpath.getRoot(...args);
					const ok=(_text=='text') && (_inbox=='inbox') && (_users=='users') && (root==users) &&
						(user.inbox==inbox) && (inbox[messageIx]==message) && (message.text==text);
					return ok?0:'error';
				}
			}])
	}})(dataset,'users')
);

assertTrue(
	()=>valueTest({
		'*':{
			id:jpath.key(),
			email:jpath.email(),
			inbox:jpath.either(undefined,[,,{
				from:(...args)=>{
					const [senderId,message,inbox,user,users]=jpath.getValues(...args);
					const path=jpath.getPath(...args);
					return users[senderId]?0:`"${senderId}"(${path}) must exist in the dataset!`
				}
			}])
	}})(dataset)
);


assertTrue(
	()=>valueTest({
		'*':{
			id:String,
			email:jpath.email('strict')
		}
	})(dataset)
);

console.group(FG_YELLOW,'test versus filter results',FG_RESET);
	assertFalse(
		()=>valueTest([{id:'admin'},{id:'support'}])(
			Object.values(dataset).filter(valueFilter({
				inbox:jpath.notEmpty(Array)
			}))
		)
	);
	assertFalse(
		()=>valueTest([dataset.admin,dataset.support])(
			Object.values(dataset).filter(valueFilter({
				inbox:jpath.notEmpty(Array)
			}))
		)
	);
	assertFalse(
		()=>valueTest([{id:'sales'}])(
			Object.values(dataset).filter(valueFilter({
				inbox:undefined
			}))
		)
	);
	assertFalse(
		()=>valueTest([dataset.sales])(
			Object.values(dataset).filter(valueFilter({
				inbox:undefined
			}))
		)
	);
console.groupEnd();

assertTrue(
	()=>valueTest({'*':{
		name:jpath.unique(String)
	}})(dataset)
);

assertFalse(
	()=>valueTest({'*':{
		email:jpath.unique(String)
	}})(dataset)
)


assertFalse('Sealed test(all the object properties are validated)',
	()=>valueTest({
		[jpath.sealed]:true,
		'admin,sales,support':Object
	})(dataset)
);

assertTrue('Sealed test(some of the properties are not validated)',
	()=>valueTest({
		[jpath.sealed]:true,
		'admin':Object
	})(dataset)
);

assertTrue('Sealed test(some of the properties are not validated)',
	()=>valueTest({
		[jpath.sealed]:(notValidatedKeys,...args)=>`${notValidatedKeys.join(',')} can not be present in ${jpath.getPath(...args)}`,
		'admin':Object
	})(dataset,'dataset')
);

assertTrue('Empty string key(error)',
	()=>valueTest({
		'*':{
			id:jpath.key()
		}
	})({'':{id:''}})
);

assertFalse('Empty string key(accepted)',
	()=>valueTest({
		'*':{
			id:jpath.key(String)
		}
	})({'':{id:''}})
);

assertFalse('name filter function',
	()=>valueTest({
		[jpath.sealed]:true,
		[jpath.nameFilter(k=>true)]:{
			id:jpath.key(String)
		}
	})(dataset)
);

assertTrue('name filter function',
	()=>valueTest({
		[jpath.sealed]:true,
		[jpath.nameFilter(k=>false)]:{
			id:jpath.key(String)
		}
	})(dataset)
);

assertFalse('name filter array',
	()=>valueTest({
		[jpath.sealed]:true,
		[jpath.nameFilter(['admin','sales','support'])]:{
			id:jpath.key(String)
		}
	})(dataset)
);

assertTrue('name filter array',
	()=>valueTest({
		[jpath.nameFilter(['foo','bar'])]:{
			id:jpath.key(String)
		}
	})(dataset)
);

assertFalse('name filter reg-ex',
	()=>valueTest({
		[jpath.sealed]:true,
		[jpath.nameFilter(/admin|support|sales/)]:{
			id:jpath.key(String)
		}
	})(dataset)
);

assertTrue('name filter reg-ex',
	()=>valueTest({
		[jpath.nameFilter(/foo|bar/)]:{
			id:jpath.key(String)
		}
	})({foo:{},bar:{}})
);

assertFalse(
	()=>valueTest({
		foo:jpath.testOrUpdate(
			{x:Number,y:Number},
			String,
			(v,n,p)=>({x:+p.foo*3,y:+p.foo+3})
		)
	})({foo:'4'})
);

assertTrue(
	()=>valueTest({
		foo:jpath.testOrUpdate(
			{x:Number,y:Number},
			String,
			(v,n,p)=>({x:+p.foo*3,y:'8'})
		)
	})({foo:'4'})
);

assertFalse(
	()=>valueTest({
		foo:jpath.testOrUpdate(
			{x:Number,y:Number},
			String,
			{x:10,y:4}
		)
	})({foo:'4'})
);

assertTrue(
	()=>valueTest({
		foo:jpath.testOrUpdate(
			{x:Number,y:Number},
			String,
			{x:10,y:'4'}
		)
	})({foo:'4'})
);

assertFalse(
	()=>valueTest(jpath.all(
		{'*':{id:jpath.ID()}},
		{'*':{id:jpath.key()}}
	))({a:{},b:{},c:{}})
);

assertFalse(
	()=>valueTest(jpath.all(
		[,,{id:jpath.ID()}],
		[,,{id:jpath.key()}]
	))([{},{},{}])
);


assertFalse(
	()=>valueTest(Array(5))([1,2,3,4,5])
);


assertTrue(
	()=>valueTest(Array(4))([1,2,3,4,5])
);
