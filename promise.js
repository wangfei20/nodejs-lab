
function Promise(fun){
	this.fun = fun;
	this.sets = new Array();
	this.index = 0;
}

Promise.prototype.then = function(succ,fail){
	var self = this;
	var success = function(result){
		var p = succ(result)
		var set = self.sets.shift()
		p ? (p.fun(self.success,set.failure)) : null;
	}
	var failure = function(err){
		var p = fail(err)
		var set = self.sets.shift()
		p ? (try{p.fun(set.success,set.failure)} catch(e){self.catch(e)}) : null;
	}


	if(this.index == 0){
		this.index++;
		process.nextTick(function(){
			pro.fun(success,failure)
		})
	} else
		this.sets.push({success,failure})

	return this;
}

Promise.prototype.catch = function(catchHandler){

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
