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
const nameFilter=(pattern)=>{
    if(typeof pattern=='symbol'){
        const fn=globalThis[pattern];
        return names => names.filter(fn);
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
                case Number  :return (v,...args) => (typeof v == 'number')  ?0:(`"${getPath(v,...args)}" ${errorMessage||'must be a number'}`);
                case String  :return (v,...args) => (typeof v == 'string')  ?0:(`"${getPath(v,...args)}" ${errorMessage||'must be a string'}`);
                case Boolean :return (v,...args) => (typeof v == 'boolean') ?0:(`"${getPath(v,...args)}" ${errorMessage||'must be a boolean'}`);
                case Object  :return (v,...args) => (typeof v == 'object')  ?0:(`"${getPath(v,...args)}" ${errorMessage||'must be an object'}`);
				case Function:return (v,...args) => (typeof v == 'function')?0:(`"${getPath(v,...args)}" ${errorMessage||'must be a function'}`);
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
                return (v,...args) => pattern.test(v)?0:(`"${getPath(v,...args)}" "${v}" `+ (errorMessage|| `must match regular expression ${pattern}`));  
            }else
            if(Array.isArray(pattern)){
                let firstFilled=0,filledCount=0;pattern.forEach((x,i)=>(firstFilled||=i,filledCount++));
                if(!filledCount){//e.g. foo=[], foo=[,,,], foo:Array(8),  the value must be an array with the same length as the empty array pattern
                    return (v,...args) => Array.isArray(v) && (v.length==f.length)?0:`"${getPath(v,...args)}" must be an array of ${f.length} items`;  
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
					name :nameFilter(key),
					value:valueTest(pattern[key])
				}));
                return (v,...args) =>{//V[k]==v
                    //console.log('testing',v,k, 'with', nameValueTests);
                    if(v===undefined){
                        return `"${getPath(v,...args)}" ${errorMessage||'must be defined...'}`;
                    };
					if(typeof v != 'object'){
						return `"${getPath(v,...args)}" ${errorMessage||'must be an object...'}`;
					};
                    const keys=Object.keys(v);
					return nameValueTests[sFirstError](test => test.name(keys)[sFirstError](key =>
						test.value(v[key],key,v,...args)
					));
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
	return (v,...args) => test(v,...args) || (!v.length?0:`"${getPath(v,...args)}" must be empty`);
}

const notEmpty=(pattern)=>{
	const test=valueTest(pattern);
	return (v,...args) => test(v,...args) || (v.length?0:`"${getPath(v,...args)}" should not be empty`);
}

const key=(pattern)=>{
	const test=pattern && valueTest(pattern);
	return (value,key,self,skey,parent,...ancestors)=> (test && test(value,key,self,skey,parent,...ancestors)) || 
		((self===parent[value])?0:`"${getPath(value,key,self,skey,parent,...ancestors)}" must be an identity property`);  
}

const unique=(pattern)=>{
	const test=pattern && valueTest(pattern);
	const parentTest=valueTest(Array);
	return	(value,key,self,skey,parent,...ancestors) => 
				(test && test(value,key,self,skey,parent,...ancestors)) || parentTest(parent,...ancestors) ||
					( (self==parent.findLast(item=>item[key]==value))?0:`"${getPath(value,key,self,skey,parent,...ancestors)}" must be unique`);
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

const emailStrict=/(?:[a-z0-9+!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/i;
const emailSimple=/[^\s@]+@[^\s@]+\.[^\s@]+/;
const email=(strict)=>valueTest(strict?emailStrict:emailSimple,'must be a valid email address');

const isoDate=()=>{
	return (v,...args)=> isNaN(new Date(v).valueOf())?`${getPath(v,...args)} "${v}" must be a valid date`:0;
}


if(typeof module != 'undefined'){
    module.exports={
		getKeys		,
		getPathKeys	,
		getValues	,
		getPathValues,
		getPath		,
		getRoot		,
		nameFilter	,
		valueTest	,
		valueFilter	,
		key			,
		unique		,
		either		,
		all			,
		not			,
		empty		,
		notEmpty	,
		email		,
		isoDate
	};
};