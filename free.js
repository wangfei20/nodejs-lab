var app = function(req, res, next) {
    app.handle(req, res, next);
    res.app = req.app = app;
    res.redirect = app.redirect;
}


app.routers = {};
app.middlewares = new Array();

app.use = function(url, method, handler) {
    if (handler) {
        app.route(url, method, handler);
    } else
        app.middlewares.push(url);
}

app.route = function(url, method, handler) {
    if (!app.routers[url + method])
        app.routers[url + method] = new Array();
    var router = app.routers[url + method];
    router.push(handler);
}

app.handle = function(req, res, next) {
    iterate(app.middlewares, req, res, function() {
        var router = app.routers[req.url + req.method];

        if (router)
            iterate(router, req, res, next);
        else if (next)
            next(req, res);
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

app.redirect = function(){}

module.exports = app;