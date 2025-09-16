class FPromise {
	constructor(fun) {
		this.fun = fun;
		this.sets = new Array();
		this.index = 0;
	}
	static promisify(func) {
		return function (...args) {
			return new FPromise(function (succ, fail) {
				func(...args, function (err, data) {
					if (!err)
						succ(data);

					else
						fail(err);
				});
			});
		};
	}
	then(succ, fail) {


		if (!succ && !fail)
			throw new Error("there has to be at least one handler!");

		let self = this;

		function getSuccessHandler(handler) {
			return function (result) {
				if (handler)
					then(result, handler);
			};
		}

		function getFailureHandler(handler) {
			return function (err) {
				if (handler)
					then(err, handler);
				else if (self.catchHandler)
					self.catchHandler(err);
			};
		}


		const then = function (data, func) {
			let p = func(data);
			let set = self.sets.shift();

			let success = getSuccessHandler(set?.success);
			let failure = getFailureHandler(set?.failure);

			if (p instanceof FPromise) {
				try {
					p.fun(success, failure);
				}
				catch (e) {
					if (self.catchHandler) self.catchHandler(e);
				}
			} else {
				try {
					success();
				}
				catch (e) {
					if (self.catchHandler) self.catchHandler(e);
				}
			};
		};


		let success = getSuccessHandler(succ);
		let failure = getFailureHandler(fail);

		if (this.index == 0) {
			this.index++;
			process.nextTick(function () {
				self.fun(success, failure);
			});
		}
		else
			this.sets.push({ success: succ, failure: fail });

		return this;
	}
	catch(catchHandler) {
		this.catchHandler = catchHandler;
	}
}







module.exports = FPromise


// function FPromise(fun){
// 	this.fun = fun;
// 	this.sets = new Array();
// 	this.index = 0;
// }

// FPromise.prototype.then = function(succ,fail) {
	

// 	if(!succ && !fail)
// 		throw new Error("there has to be at least one handler!")

// 	let self = this;

// 	function getSuccessHandler(handler){
// 		return function(result){
// 			if(handler)
// 				then(result,handler)
// 		}
// 	}

// 	function getFailureHandler(handler){
// 		return function(err){
// 			if(handler)
// 				then(err,handler)
// 			else if(self.catchHandler)
// 				self.catchHandler(err)
// 		}
// 	}


// 	const then = function(data,func){
// 		let p = func(data)
// 		let set = self.sets.shift()

// 		let success = getSuccessHandler(set?.success)
// 		let failure = getFailureHandler(set?.failure)
		
// 		if(p instanceof FPromise){
// 			try{
// 				p.fun(success,failure)
// 			}
// 			catch(e){
// 				if(self.catchHandler) self.catchHandler(e)
// 			}
// 		} else {
// 			try{
// 				success()
// 			}
// 			catch(e){
// 				if(self.catchHandler) self.catchHandler(e)
// 			}
// 		};
// 	}


// 	let success = getSuccessHandler(succ)
// 	let failure = getFailureHandler(fail)

// 	if(this.index == 0){
// 		this.index++;
// 		process.nextTick(function(){
// 			self.fun(success,failure)
// 		})
// 	} else
// 		this.sets.push({success:succ,failure:fail})

// 	return this;
// }

// FPromise.prototype.catch = function(catchHandler){
// 	this.catchHandler = catchHandler;
// }



// FPromise.promisify = function(func){
// 	return function(...args){
// 		return new FPromise(function(succ,fail){
// 			func(...args,function(err,data){
// 				if(!err)
// 					succ(data)
// 				else
// 					fail(err)
// 			})
// 		});
// 	}
// }


// module.exports = FPromise

