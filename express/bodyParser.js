var path = require("path");
var fs = require("fs");


module.exports = function(type) {

    function central(req, res, next) {

        var ct = req.headers["content-type"]
        if (ct.indexOf("multipart/form-data") != -1)
            multipart(req, res, next)
        else {
            req.body = {}
            var body = [];
            req.on("data", function(data) {
                body.push(data)
            })

            req.on("end", function() {
                var str = Buffer.concat(body).toString();

                var reg = /([^;&\s]+)=([^;&\s]+)/g
                str.replace(reg, function(a, b, c) {
                    req.body[b] = c
                })

                next()
            })
        }
    }

    function multipart(req, res, next) {

        var boundary = "--" + /boundary=(.+)/g.exec(req.headers["content-type"])[1]

        var bdlen = Buffer.byteLength(boundary)
        var buf;
        var cc;
        req.body = { fields: [], files: [] };

        function parseContent() {
            var chi = buf.indexOf("\r\n\r\n")

            if (chi != -1) {
                var ch = buf.toString('utf8', 0, chi);
                console.log("parseContent " + ch)

                var reg = /\s\n([^:;]+):\s([^:;]+)/g
                cc = {};

                ch.replace(reg, function(a, b, c) {
                    cc[b] = c
                })

                reg = /([^;\s]+)\=\"([^:;\s]+)\"/g
                ch.replace(reg, function(a, b, c) {
                    cc[b] = c
                })

                buf = buf.slice(chi + 4)
                parseBuffer();
            }

            return chi
        }

        function setValue(e) {
            if (cc.filename) {
            	var end = e - 2 || buf.length - bdlen
                req.pause();
                var content = buf.slice(0, end)
                var fullname = path.join(__dirname, cc.filename);
                fs.appendFile(fullname, content, function(res) {
                    req.resume()
                })

            	buf = buf.slice(e || end)
                if (!e) return

                cc.fullname = fullname
                req.body.files.push(cc)

            } else {

                cc.value = buf.toString('utf8', 0, e -2) // minus /r/n
                req.body.fields.push(cc)
            	buf = buf.slice(e)
            }

            cc = null
            parseBuffer();
        }

        function parseBuffer() {
            if (buf.length < bdlen + 5 && buf.indexOf(boundary + "--") != -1)
                return;

            var index = buf.indexOf(boundary)

            if (index == 0) {
                parseContent();
            } else {

                setValue(index == -1 ? null : index)
            }
        }

        req.on("data", function(data) {
            buf ? buf = Buffer.concat([buf, data]) : buf = data;
            parseBuffer()
        })

        req.on("end", function() {
            next()
        })
    }

    return central;


        /*function parseValue(index, nextbound) {

            cc.value = buf.toString('utf8', index, nextbound - 2) // minus /r/n
            req.body.fields.push(cc)
            console.log("parseValue", cc.value)
            cc = null
            buf = buf.slice(nextbound)
            //remainBt = 0
            parseBuffer()
        }

        function appendFile(start, end) {
            var e = end - 2 || buf.length - start - bdlen;
            req.pause();
            var filedata = buf.slice(start, e)
            fs.appendFile(path.join(__dirname, cc.filename), filedata, function(res) {
                req.resume()
            })

            buf = buf.slice(start + (end || e))

            if (end) {
                cc.value = path.join(__dirname, cc.filename)
                req.body.files.push(cc)
                cc = null
                parseBuffer()
            }
            //remainBt = bdlen
        }*/
}
