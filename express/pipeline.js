// app管理各个路由，以pattern作为分流的规则进入对应路由
// pattern -> mid -> match -> router -> router mids -> router handler

// pattern -> 

function pipeline(next,config) {

    var app = function(ctx) {
        var route = app.routers[ctx.pattern];
        if(route)
        	app.mainRouter.handler = function(ctx,next){route.handle(ctx,next)}; 
        app.mainRouter.handle(ctx,next);
    }    
	for(var k in config){
		app[k] = config[k]
	}


    app.mainRouter = new Router("");
    app.routers = [];

    app.use = function(f) {
        app.mainRouter.use(f)
        return app;
    }

    app.route = function(pattern, handler) {
        var router = new Router(pattern, handler);
        app.routers[pattern] = router;
        return router;
    }

    return app;
}

var Router = function(pattern, handler) {
    this.middlewares = [];
    this.pattern = pattern;
    this.handler = handler;


	this.use = function(mid) {
		if(Array.isArray(mid)) {
			for(var m of mid)
				this.middlewares.push(m);
			
		}else this.middlewares.push(mid)

	    return this;
	}

	this.handle = function(ctx,nextPipe) {
		var index = 0;
		var handlers = [].concat(this.middlewares);
		if(this.handler)
			handlers.push(this.handler)

		function next(){
			if(index < handlers.length){
				var h = handlers[index++]
				h(ctx,next);
			}
			else{
				if(nextPipe)
					nextPipe(ctx)
			}
		}

	    next()
	}
}


module.exports = {pipeline,Router};