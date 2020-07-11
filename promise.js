
function Promise(fun){
	this.fun = fun;
	this.sets = new Array();
	this.index = 0;
}

Promise.prototype.then = function(succ,fail){
	var pro = this;
	var success = function(result){
		var p = succ(result)
		var set = pro.sets.shift()
		p ? (p.fun(set.success,set.failure)) : null;
	}
	var failure = function(err){
		var p = fail(result)
		var set = pro.sets.shift()
		p ? (p.fun(set.success,set.failure)) : null;
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


module.exports = Promise