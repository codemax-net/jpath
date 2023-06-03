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

function assertPos(fn){
	const ret=fn();
	console.log(FG_RESET);
	if(!ret){
		console.log(FG_RED,'assertPos',FG_RESET,fn.toString(), '\n\t','failed',FG_RED,ret,FG_RESET);
		process.exit(-1);
	}else{
		console.log(FG_GREEN,'assertPos',FG_RESET,fn.toString(), '\n\t','passed',FG_YELLOW_BRIGHT, ret, FG_RESET);
	}
}
function assertNeg(fn){
	const err=fn();
	console.log(FG_RESET);
	if(err){
		console.log(FG_RED,'assertNeg',FG_RESET,fn.toString(), '\n\t','failed',FG_RED,err,FG_RESET);
		process.exit(-1);
	}else{
		console.log(FG_GREEN,'assertNeg',FG_RESET,fn.toString(), '\n\t','passed',FG_YELLOW_BRIGHT,err,FG_RESET);
	}
}

console.group(FG_YELLOW,'primitive jpath test',FG_RESET);
	assertNeg(()=>valueTest(String)("string")		);
	assertPos(()=>valueTest(String)(123)			);
	
	assertNeg(()=>valueTest(Number)(123)			);
	assertPos(()=>valueTest(Number)(null)			);
	
	assertNeg(()=>valueTest(Object)(null)			);
	assertPos(()=>valueTest(Object)(123)			);
	
	assertNeg(()=>valueTest(Object)({})				);
	assertPos(()=>valueTest(Object)("string")		);
	
	assertNeg(()=>valueTest(Function)((x)=>x)		);
	assertPos(()=>valueTest(Function)([])			);
	
	assertNeg(()=>valueTest(Array)([])				);	
	assertPos(()=>valueTest(Array)(undefined)		);
	
	assertNeg(()=>valueTest(undefined)(undefined)	);
	assertPos(()=>valueTest(undefined)(null)		);
	
	assertNeg(()=>valueTest(null)(null)				);	
	assertPos(()=>valueTest(null)(undefined)		);	
console.groupEnd();

assertNeg(()=>valueTest({'*':{}})(dataset)			);

assertNeg(
	()=>valueTest({
		'*':{
			id:String,
			email:String
		}
	})(dataset)										
);

assertNeg(
	()=>valueTest({
		'*':{
			[/id|email/]:String
		},
		'admin':{
			isAdmin:true
		}
	})(dataset)										
);

assertNeg(
	()=>valueTest({
		'*':{
			[/id|email/]:String
		}
	})(dataset)										
);

assertNeg(
	()=>valueTest({
		'*':{
			id:jpath.key(),
			email:jpath.email(),
			name:jpath.notEmpty(String),
			inbox:jpath.either(undefined,Array)
		}
	})(dataset)										
);

assertPos(
	()=>valueTest({
		'*':{
			id:jpath.key(),
			email:jpath.email(),
			inbox:Array
	}})(dataset)									
);

assertNeg(
	()=>valueTest({
		'*':{
			id:jpath.key(),
			email:jpath.email(),
			inbox:jpath.either(undefined,[,,{from:String,text:String}])
		}
	})(dataset)										
);

assertPos(
	()=>valueTest({
		'*':{
			id:jpath.key(),
			email:jpath.email(),
			inbox:jpath.either(undefined,[,,{from:jpath.notEmpty(String),text:jpath.notEmpty(String)}])
	}})(dataset)
);

assertPos(
	()=>valueTest({
		'*':{
			name:jpath.key()//assuming that "name" should have been an identity property 
		}
	})(dataset)										
);


assertNeg(
	()=>valueTest([,,{
			id:jpath.unique(),
			email:jpath.email(),
			inbox:jpath.either(undefined,[,,{from:String,text:String}])
	}])(Object.values(dataset))										
);

assertNeg(
	()=>valueTest([{isAdmin:true},{id:'sales'},{id:'support'}])(Object.values(dataset))										
);
assertPos(
	()=>valueTest([{id:'sales'},{id:'support'},{isAdmin:true}])(Object.values(dataset))										
);

assertPos(
	()=>{
		const hasInboxFilter=valueFilter({
				inbox:[,,{from:String,text:String}]
			});
		const usersWithInbox=Object.values(dataset).filter(hasInboxFilter);
		const usersWithoutInbox=Object.values(dataset).filter(jpath.not(hasInboxFilter));
		return (usersWithInbox.length==2) && (usersWithInbox[0]==dataset.admin) && (usersWithoutInbox.length==1);
	}		
);

assertNeg(
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

assertPos(
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


assertNeg(
	()=>valueTest(jpath.isoDate())(new Date().toISOString())
);

assertNeg(
	()=>valueTest(jpath.isoDate())('2020-10-10')
);

assertNeg(
	()=>valueTest(jpath.isoDate())('2020-10-10T12:20')
);

assertPos(
	()=>valueTest(jpath.isoDate())('this is not a date')
);

assertPos(
	()=>valueTest({
		'*':{
			id:String,
			email:jpath.email('strict')
		}
	})(dataset)										
);



