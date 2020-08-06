
function Promise(fun){
	this.fun = fun;
	this.sets = new Array();
	this.index = 0;
}

Promise.prototype.then = function(succ,fail){

	if(!succ && !fail)
		throw new Error("there has to be at least one handler!")

	var self = this;

	const then = function(data,func){
		var p = func(data)
		var set = self.sets.shift()

		if(p){
			try{
				p.fun(set.success,set.failure)
			}
			catch(e){
				if(self.catchHandler)self.catchHandler(e)
			}
		} else if(set) {
			try{
				if(set.success)
					set.success()
				else if (set.failure)
					set.failure()
			}
			catch(e){
				if(self.catchHandler)self.catchHandler(e)
			}
		};
	}

	const success = function(result){
		if(succ)
			then(result,succ)
	}
	const failure = function(err){
		if(fail)
			then(err,fail)
		else if(self.catchHandler)
			self.catchHandler(err)
	}

	/*var success = function(result){
		var p = succ(result)
		p ? p.fun(set.success,set.failure) :  null;
	}
	var failure = function(err){
		var p = fail(err)
		var set = self.sets.shift()
		p ? p.fun(set.success,set.failure) :  null;
	}*/


	if(this.index == 0){
		this.index++;
		process.nextTick(function(){
			self.fun(success,failure)
		})
	} else
		this.sets.push({success,failure})

	return this;
}

Promise.prototype.catch = function(catchHandler){
	this.catchHandler = catchHandler;
}

Promise.promisify = function(func){
	return function(...args){
		return new Promise(function(succ,fail){
			func(...args,function(err,data){
				if(!err)
					succ(data)
				else
					fail(err)
			})
		});
	}
}


module.exports = Promise
