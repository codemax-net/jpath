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
	console.log(FG_YELLOW,title||'');
	if(!ret){
		console.log(FG_RED,'assertTrue',FG_RESET,fn.toString(), '\n\t','failed',FG_RED,ret,FG_RESET);
		process.exit(-1);
	}else{
		console.log(FG_GREEN,'assertTrue',FG_RESET,fn.toString(), '\n\t','passed',FG_YELLOW_BRIGHT, ret, FG_RESET);
	}
}
function assertFalse(title,fn){
	if(!fn){
		fn=title;
		title='';
	};
	const err=fn();
	console.log(FG_YELLOW,title||'');
	if(err){
		console.log(FG_RED,'assertFalse',FG_RESET,fn.toString(), '\n\t','failed',FG_RED,err,FG_RESET);
		process.exit(-1);
	}else{
		console.log(FG_GREEN,'assertFalse',FG_RESET,fn.toString(), '\n\t','passed',FG_YELLOW_BRIGHT,err,FG_RESET);
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

console.group(FG_YELLOW,'date jpath test',FG_RESET);
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
console.groupEnd();

assertFalse('dataset is an object of objects',()=>valueTest({'*':{}})(dataset));

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


