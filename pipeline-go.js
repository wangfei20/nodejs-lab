// app管理各个路由，以pattern作为分流的规则进入对应路由
// pattern -> mid -> match -> router -> router mids -> router handler

// pattern -> 

function pipeline(next,config) {

    var app = function(ctx) {
        var route = app.routers[ctx.pattern];
        var nextHandler = next ? function(){return next(ctx)} : function(){};
        app.mainRouter.handler = route ? function() {
            return route.handle(ctx,nextHandler)
        } : function() { return nextHandler(ctx)};
        app.mainRouter.handle(ctx);
    }    

	
    app.mainRouter = new Router("");
    app.routers = [];

	for(var k in config)
		app[k] = config[k]
    app.use = function(f) {
        app.mainRouter.use(f)
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
		var self = this;
		function push(f){
		    self.middlewares.push(function(ctx,next) {
		        return function() { f(ctx, next) };
		    });
		}

		if(Array.isArray(mid)) {
			for(var m of mid)
				push(m);
			
		}else push(mid)

	    return this;
	}

	this.handle = function(ctx,next) {

		if(this.pattern != "")
		{
			var h = this.handler;
			this.handler = function(){

				return h(ctx,next)
			}
		}

		for (var i = this.middlewares.length - 1; i >= 0; i--) {
		    this.handler = this.middlewares[i](ctx,this.handler);
		        //console.log("app.handler", app.handler)
		}
		//    this.handled = true;
	    //}
	    this.handler(ctx)
	}
}


module.exports = {pipeline,Router};