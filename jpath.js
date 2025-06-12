/**
* 	JavaScript Language Transformations and Templating - JPATH extentions
*	
*	<a href="http://jsl3.codemax.net/jsl3.1.js">http://jsl3.codemax.net/jsl3.1.js</a>
*	<a href="http://jsl3.codemax.net/">http://jsl3.codemax.net/</a>
*	
* 	
*	version	: 1.1 
*	author	: dr. G.Metaxas
* 	Copyright 2020 Ambianti B.V.
* 	
*	Permission is hereby granted, free of charge, to any person obtaining a copy of this software and 
*	associated documentation files (the "Software"), to deal in the Software without restriction, 
*	including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, 
*	and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, 
*	subject to the following conditions:
*	
*	The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*	
*	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, 
*	INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. 
*	IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, 
*	WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE 
*	SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*	
*/
(function(designator){

	/**
		@param pattern
			when the pattern is a string or a number then the filter returns [pattern].
				Thus the tested object must have a property named pattern that passes the value test
			when the pattern is a function then the filter returns a function that filters
				the names of the tested object that pass the filter function specified by pattern.
				(The filter function is a function as the Array.prototype.filter callback function)
			when the pattern is an array then the filter returns pattern
				Thus the tested object must have all the properties defined in pattern passing the value test
			when the pattern is a regular expression then the filter returns a function that filters
				the names of the tested object that pass the regular expression specified by pattern.
	*/
	const nameFilter=function nameFilter(pattern){
		const filterSymbol=Symbol();
		let filterFunction;
		switch(typeof pattern){
			case 'string'	: case 'number'	://so that we can filter without escaping(since the literal keys use *, ^, / as special characters)
				filterFunction= names=>[pattern];//the object must have the propery 
				break;
			case 'function'	:
				filterFunction= names=> names.filter(pattern);
				break;
			case 'object'	:
				if(Array.isArray(pattern)){
					filterFunction= names => pattern;//all the items in the pattern must pass the test
					break;
				}else
				if(pattern instanceof RegExp){
					filterFunction= names=> names.filter(key=> pattern.test(key));
					break;
				}
			default:
				throw new Error('Unsupported pattern');
		};
		nameFilter[filterSymbol]=filterFunction;
		return filterSymbol;
	}

	/**
		used internally to convert filter names to filter functions
		@param pattern
			- when the pattern is a symbol, we look in the dictionary for a specified filter function(see above)
			- when the pattern is '*' then we return a function that matches all the names
			- when the pattern starts with '^' then we return a function that matches any name except those defined in the comma separated list e.g. '^foo,bar': ...
			- when the pattern starts with '/' then we return a function that matches any name that the regular expression described by the pattern matches
			- in all other cases we return a function that matches the names in the comma separated list defined by pattern
			- when the pattern starts with '\' then it is considered an escape character (allowing to treat "*","^","/",and "," as normal characters)
	*/
	const nameToFilter=(pattern)=>{
		if(typeof pattern == 'symbol'){
			const fn=nameFilter[pattern];
			return (typeof fn == 'function')?fn: names => names.filter(k=>k==pattern);
		}else
		if(pattern[0]=='\\'){// so that we can use "*", "^" , "/" and "," as path-selectors 
			return names => [pattern.slice(1)];
		}else
		if(pattern=='*'){//matches all names
			return names => names;
		}else				
		if(pattern[0]=='^'){//matches any name except those defined in the comma separated list e.g. '^foo,bar': ...
			const exlcude=new Set(pattern.slice(1).split(','));
			return names => names.filter(k => !exlcude.has(k));
		}else
		if(pattern[0]=='/'){//matches any name that the regular expression described by the pattern matches
			const regEx=new RegExp(pattern.slice(1,-1));
			return names => names.filter(k => regEx.test(k));
		}else{//matches the names in the comma separated lsit
			const keys=pattern.split(',');
			return names => keys;
		};
	}

	/*special property for testing "Sealed" Objects, i.e. all their properties must be validated by one of the patterns.
		e.g. the valueTest below validates object with exactly the foo and bar string properties 
		{
			[jpath.sealed]:true,
			/foo|bar/:String,
		}
	*/
	const sSealed=Symbol('Sealed object');

	const sFirstError=Symbol();
	Array.prototype[sFirstError]=function(callback){
		let n=this.length,e=0;
		for(let i=0; i<n; i++){
			if(e=callback(this[i],i,this)){
				return e;
			};
		};
		return e;
	}

	const getRoot=(...args)=>{
		const n=args.length;
		const i=(n-1) - ((n-1) % 2);
		return args[i];
	}

	const getPath=(...args)=>{
		let s='',k=[],v=[];
		for(let i=1;i<args.length;i+=2){
			s='/'+encodeURIComponent(args[i])+s;
		};
		return s;
	}

	const getKeys=(...args)=>{
		const k=[];
		for(let i=1;i<args.length;i+=2){
			k.push(args[i]);
		};
		return k;
	}

	const getValues=(...args)=>{
		const v=[];
		for(let i=0;i<args.length;i+=2){
			v.push(args[i]);
		};
		return v;
	}

	const getPathKeys=(...args)=>getKeys(...args).reverse();
	const getPathValues=(...args)=>getValues(...args).reverse();

	/*
	 a value test function has the form
	   (v0,k0,v1,k1,v2,k2,v3,.....vN) =>  error 
	   (value,key,self,self_key,parent,parent_key,grand_parent,grant_parent_key,.....) => error
	 
	 thus   v0=vN[ ]....[k3][k2][k1][k0]


	*/

	const valueTest=(pattern,errorMessage)=>{
		switch(typeof pattern){
			case 'function':
				switch(pattern){
					case Number  :return (v,...args) => (typeof v == 'number')  ?0:(`"${getPath(v,...args)}"(${v}) ${errorMessage||'must be a number'}`);
					case String  :return (v,...args) => (typeof v == 'string')  ?0:(`"${getPath(v,...args)}" ${errorMessage||'must be a string'}`);
					case Boolean :return (v,...args) => (typeof v == 'boolean') ?0:(`"${getPath(v,...args)}" ${errorMessage||'must be a boolean'}, found ${v}`);
					case Object  :return (v,...args) => (typeof v == 'object')  ?0:(`"${getPath(v,...args)}" ${errorMessage||'must be an object'}`);
					case Function:return (v,...args) => (typeof v == 'function')?0:(`"${getPath(v,...args)}" ${errorMessage||'must be a function'}`);
					case Date 	 :return (v,...args) => (!isNaN(new Date(v).valueOf()))?0:(`"${getPath(v,...args)}" ${errorMessage||'must be a valid date/time'}`);
					case Array   :return (v,...args) => Array.isArray(v)		?0:(`"${getPath(v,...args)}" ${errorMessage||'must be an array'}`);
					default:
						if(errorMessage){
							return (v,...args) =>{
								const error=pattern(v,...args);
								if(error){
									return `"${getPath(v,...args)}" ${errorMessage||'error'}`;
								};
							} 	
						}else{
							return pattern;
						}
				};
				break;
			case 'object'  :
				//console.log('oo',v,f);
				if(pattern instanceof RegExp){
					return (v,...args) =>((typeof v == 'string') && pattern.test(v))?0:(`"${getPath(v,...args)}" "${v}" `+ (errorMessage|| `must match regular expression ${pattern}`));  
				}else
				if(Array.isArray(pattern)){
					let firstFilled=0,filledCount=0;pattern.forEach((x,i)=>(firstFilled||=i,filledCount++));
					if(!filledCount){//e.g. foo=[], foo=[,,,], foo:Array(8),  the value must be an array with the same length as the empty array pattern
						return (v,...args) => Array.isArray(v) && (v.length==pattern.length)?0:`"${getPath(v,...args)}" must be an array of ${pattern.length} items`;  
					}else
					if((firstFilled>1) && (firstFilled==pattern.length-1) && (filledCount==1)){//i.e.  foo:[,,X]  v must be an array of X
						const itemTest=valueTest(pattern[2]);
						return (v,...args) =>{
							if(!Array.isArray(v)){
								return `"${getPath(v,...args)}" ${errorMessage||'must be an array...'}`;
							};
							return v[sFirstError]((item,index)=>itemTest(item,index,v,...args));
						} 
					}else{//every defined pattern-item must match the respective slot in the value
						const valueTests=pattern.map(p=>valueTest(p));
						return (v,...args) =>{
							if(!Array.isArray(v)){
								return `"${getPath(v,...args)}" ${errorMessage||'must be an array...'}`;
							};
							return pattern[sFirstError]((p,i) =>valueTests[i](v[i],i,v,...args));
						};
					};
				}else
				if(pattern){
					const nameValueTests=[...Object.keys(pattern),...Object.getOwnPropertySymbols(pattern)].map(key=>({
						name :nameToFilter(key),
						value:valueTest(pattern[key])
					}));
					return (v,...args) =>{//V[k]==v
						//console.log('testing',v,k, 'with', nameValueTests);
						if((v===undefined)||(v===null)){
							return `"${getPath(v,...args)}" ${errorMessage||'must be defined...'}`;
						};
						if(typeof v != 'object'){
							return `"${getPath(v,...args)}" ${errorMessage||'must be an object...'}`;
						};
						const keys=Object.keys(v);
						if(pattern[sSealed]){
							const notValidatedKeys=pattern[sSealed] && new Set(keys);
							const error=nameValueTests[sFirstError](test => test.name && test.name(keys)[sFirstError](key =>{
								const err=(key!==sSealed) && test.value(v[key],key,v,...args);
								if(!err){
									notValidatedKeys.delete(key);
								};
								return err;
							}));
							if(!error && notValidatedKeys.size && (typeof pattern[sSealed]=='function')){
								return pattern[sSealed]([...notValidatedKeys],v,...args);
							};
							return error || (notValidatedKeys.size && `"${getPath(v,...args)}/${[...notValidatedKeys][0]}" is not allowed! Object is sealed.'}`);
						}else{
							return nameValueTests[sFirstError](test => test.name(keys)[sFirstError](key =>
								test.value(v[key],key,v,...args)
							));
						}
					}
				}else{//pattern == null, the value must be null
					return (v,...args) => (v === null)?0:`"${getPath(v,...args)}" ${errorMessage||'must be null'}`;
				};
			break;
			case 'undefined':
				return (v,...args) => (v === undefined)?0:`"${getPath(v,...args)}" ${errorMessage||'must be undefined'}`;
			default:
				return (v,...args) => (v == pattern)?0:(`"${getPath(v,...args)}" `+ (errorMessage || `${v} found, ${pattern} expected`));
		};
	};

	const not=(pattern, errorMessage)=>{
		const test=valueTest(pattern);
		return (v,...args) => test(v,...args)?'':(errorMessage || `${getPath(v,...args)} must not match ${pattern}`);
	}

	const empty=(pattern)=>{
		const test=valueTest(pattern);
		if(test({})){//the pattern does not match objects
			console.log('empty using length');
			return (v,...args) => test(v,...args) || (!v.length?0:`"${getPath(v,...args)}" must be empty`);	
		}else{
			console.log('empty using keys');
			return (v,...args) => test(v,...args) || (!Object.keys(v).length?0:`"${getPath(v,...args)}" must be empty`);
		}	
	}

	const notEmpty=(pattern,maxLength)=>{
		if(!pattern){
			return ((v,...args)=>{
				if((v!==undefined)&&(v!==null)){
					switch(typeof v){
						case 'string':
							if(v){
								return 0;
							};
							break;
						case 'object':
							if(Array.isArray(v)?v.length:Object.keys(v).length){
								return 0
							};
							break;
						default		 : 
							return 0;
					};
				};
				return `"${getPath(v,...args)}" should be defined and not empty`;
			});
		};
		const test=valueTest(pattern);
		if(maxLength!==undefined){
			return (v,...args) => test(v,...args) || ((v.length>0)&&(v.length<=maxLength)?0:`"${getPath(v,...args)}" should not be empty, max length: ${maxLength}`);		
		}else{
			return (v,...args) => test(v,...args) || (v.length?0:`"${getPath(v,...args)}" should not be empty`);		
		};
	}

	const limit=(pattern,min,max)=>{
		if(max === undefined){
			max=min;
			min=0;
		};
		const test=valueTest(pattern);
		let e;
		if((max!==Infinity) && ((test(min)||test(max)))){//the pattern matches neither numbers nor dates
			//assume we are checking for either String or Array size
			return (v,...args) => test(v,...args) || ((v.length>=min)&&(v.length<=max)?0
				:`"${getPath(v,...args)}" length:${v.length}, min length:${min}, max length: ${max}.`
			);	
		}else
		if(test(new Date(min)) && test(new Date(max))){//the pattern does not match dates
			return (v,...args) => test(v,...args) || ((v>=min)&&(v <= max)?0:
				`"${getPath(v,...args)}" min value:${min}, max value: ${max}.`
			);
		}else{
			const minStr=!min?'':`min date:${new Date(min).toISOString()}`;
			const maxStr=(max===Infinity)?'':`max date:${new Date(max).toISOString()}`;
			return (v,...args) => test(v,...args) || ((v>=min)&&(v <= max)?0:
				`"${getPath(v,...args)}" ${minStr} ${maxStr}.`
			);
		}
	}


	const key=(pattern=either(notEmpty(String),Number))=>{
		const test=pattern && valueTest(pattern);
		return (value,key,self,skey,parent,...ancestors)=> (test && test(value,key,self,skey,parent,...ancestors)) || 
			((self===parent[value])?0:`"${getPath(value,key,self,skey,parent,...ancestors)}" must be an identity property`);  
	}

	const ID=()=>{
		return (v0,k0,v1,k1)=> {
			v1[k0]=k1;
			return 0;
		}
	}

	const unique=(pattern)=>{
		const test=pattern && valueTest(pattern);
		const parentTest=valueTest(Object);
		return	(value,key,self,skey,parent,...ancestors) => 
					(test && test(value,key,self,skey,parent,...ancestors)) || //error pattern doesn't match
					parentTest(parent,...ancestors) ||						   //error parent is not an object
					(/*
						[parent
							[skey]{self
								[key]:value
							}
						]
						if we search in parent we should find 
							a single object | object[key]==value, object==self
					*/					
						(Array.isArray(parent)
							?self==parent.find((item,index)=> (index<=skey) && (item[key]==value))
							:self==Object.values(parent).findLast((item,index)=> item[key]==value)
						)?0:`"${getPath(value,key,self,skey,parent,...ancestors)}" must be unique`
					);
	}

	const either=(...patterns)=>{
		const tests=patterns.map(pattern=>valueTest(pattern));
		return	(...args)=>{
			const errors=[];
			for(let error,i=0;(i<tests.length);i++){
				if(error=tests[i](...args)){
					errors.push(error);
				}else{
					return 0;
				}
			};
			return errors.reverse().join(', or ')||0;
		};
	}

	const valueFilter=(pattern) =>{
		const test=valueTest(pattern);
		return (...args)=>!test(...args);
	} 

	const all=(...patterns)=>{
		const tests=patterns.map(pattern=>valueTest(pattern));
		return	(...args)=> tests[sFirstError](test=>test(...args));
	}

	/**
		testOrUpdate uses the newTest as a value-test
			when the newTest fails, and the value matches the oldTest updValue is used to update the old value
		if updValue is a function
			when it returns undefined we assume that it altered the value directly, otherwise we update the value using its result 
	*/
	const testOrUpdate=(newTest,oldTest,updValue)=>{
		const updValueIsFunction=typeof updValue=='function';
		newTest=valueTest(newTest);
		oldTest=valueTest(oldTest);
		return	(v,n,p,...rest)=>{
			let err=newTest(v,n,p,...rest);
			if(err && !oldTest(v,n,p,...rest)){//update
				if(updValueIsFunction){
					v=updValue(v,n,p,...rest);
					if(v!==undefined){
						p[n]=v;
					};	
				}else{
					p[n]=updValue;
				};
				err=newTest(p[n],n,p,...rest);
				if(err){
					return 'Update failed! '+err;
				};
			};
			return err;
		};		
	};

	const emailStrict=/(?:[a-z0-9+!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/i;
	const emailSimple=/[^\s@]+@[^\s@]+\.[^\s@]+/;
	const email=(strict)=>valueTest(strict?emailStrict:emailSimple,'must be a valid email address');

	// allows parenthesis and dashes, accepts + in the beggining
	const phoneRegEx=/^((((\(\+\d+\))|\+\d+)[\s-]*){0,1})(((\(\d+\))|\d+)[\s-]*)+$/ ;
	const phone=(options)=>{
		return	valueTest(phoneRegEx,'must be a valid phone number');
	}

	const isoDateRegEx=/(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d(:[0-5]\d(\.\d+){0,1}){0,1}([+-][0-2]\d:[0-5]\d|Z))/;
	const isoDate=()=>{
		return (v,...args)=> isNaN(new Date(v).valueOf())?`${getPath(v,...args)} "${v}" must be a valid iso time stamp`:0;
	}
	Object.assign(designator,{
			sealed:sSealed,
			getKeys		,
			getPathKeys	,
			getValues	,
			getPathValues,
			getPath		,
			getRoot		,
			nameFilter	,
			valueTest	,
			valueFilter	,
			ID			,
			key			,
			unique		,
			either		,
			all			,
			not			,
			empty		,
			notEmpty	,
			limit		,
			email		,
			phone		,
			isoDate		,
			testOrUpdate,
	})

})(typeof module!='undefined'?(module.exports||={}):(globalThis[Symbol.for('@codemax.net/jpath')]||={}));