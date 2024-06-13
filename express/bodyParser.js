const path = require("path");
const fs = require("fs");
const querystring = require('querystring');

module.exports = function() {

    function parseBody(req, res, next) {

        const ct = req.headers["content-type"] || '';

        if (ct.includes("multipart/form-data"))
            multipart(req, res, next);
        else {
            req.body = {};
            let body = [];
            req.on("data", function(data) {
                body.push(data);
            })

            req.on("end", function() {
                const bodyStr = Buffer.concat(body).toString();

                if (ct.includes("application/json")) {
                    req.body = JSON.parse(bodyStr);
                } else if (ct.includes("application/x-www-form-urlencoded")) {
                    req.body = querystring.parse(bodyStr);
                }

                next();
            })
        }
    }

    function multipart(req, res, next) {

        let boundary = "--" + /boundary=(.+)/g.exec(req.headers["content-type"])[1]

        let bdlen = Buffer.byteLength(boundary)
        let buf;
        let cc;
        req.body = { fields: [], files: [] };

        function parseContent() {
            let chi = buf.indexOf("\r\n\r\n")

            if (chi != -1) {
                let ch = buf.toString('utf8', 0, chi);
                console.log("parseContent " + ch)

                let reg = /\s\n([^:;]+):\s([^:;]+)/g
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
            	let end = e - 2 || buf.length - bdlen
                req.pause();
                let content = buf.slice(0, end)
                let fullname = path.join(__dirname, cc.filename);
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

            let index = buf.indexOf(boundary)

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

    return parseBody;

}
