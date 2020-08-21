var app = function(req, res, next) {
    res.app = req.app = app;
    app.req = req;
    app.res = res;
    res.redirect = app.redirect;


    app.handle(req, res, next);
}


app.routers = {};
app.middlewares = new Array();

app.use = function(handler) {
    app.middlewares.push(handler);
}

function createReg(str){
    var reg = /:[^\/]+/g;
    if(reg.test(str))
        return str.replace(reg,"[^\/]+");
}

app.route = function(url, method, mid, handler) {

    var pattern = createReg(url);
    if(pattern)
        pattern += method;
    else pattern = url + method;

    console.log("new pattern ", pattern);

    if (!app.routers[pattern])
        app.routers[pattern] = new Array();
    var router = app.routers[pattern];

    if(Array.isArray(mid)){
        for(var i in mid)
            router.push(mid[i]);
    }else{
        router.push(mid);
    }
        if(handler)
            router.push(handler);
}

app.handle = function(req, res, next) {
    iterate(app.middlewares, req, res, function() {
        var router = app.match(req.url,req.method);

        if (router)
            iterate(router, req, res, next);
        else {

            if (next)
                next(req, res);
        }
    });

    function iterate(middlewares, req, res, next) {
        var i = 0;

        function nextMid() {
            if (i < middlewares.length)
                middlewares[i++](req, res, nextMid);
            else if (next)
                next(req, res);
        }
        nextMid();
    }
}


app.match = function(url,method){
    var pattern = url+method;
    console.log("pattern ",pattern);
    var route = app.routers[pattern];
    if(route)
        return route;

    for(var r in app.routers){
        var reg = new RegExp(r);
        var result = reg.test(pattern)

        console.log("reg match ", r, result)
        if(result)
            return app.routers[r];
    }
}

app.redirect = function(url){
    app.req.url = url;
    app.handle(app.req,this);
}

module.exports = app;