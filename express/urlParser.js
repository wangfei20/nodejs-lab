
function urlParser(req) {
	var url = req.url;
    var reg = /([^?]+)?/;
    req.path = url.match(reg)[0];

    reg = /([^?&]+)=([^&]+)/g;

    req.query = {};
    req.params = [];

    var s = url.replace(reg, function(_, b, c) {
        req.query[b] = c;
        return "";
    })

    req.params = req.path.split("/");
    req.params.shift();

}

module.exports = urlParser