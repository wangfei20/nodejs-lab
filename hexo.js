var { pipeline, Router } = require("./pipeline.js")
var fs = require("fs")
var path = require("path")
var yaml = require("js-yaml")
var express= require("express")
var ejs = require("ejs")
var markdown = require("markdown").markdown;
var yamlFront = require("yaml-front-matter")
var Promise = require('bluebird');
/*
config
	读yaml配置文件，获得nav,全局数据等

source

layout

*/

function promisify(func) {
    return function(data, next) {
        func(data, function(err, result) {
            if (!err)
                next();
            else
                console.log(err);
        })
    }
}


function spreadFiles(directory, callback) {
    fs.readdir(path.join(__dirname, directory), { withFileTypes: true }, function(err, subs) {
        if (err)
            callback();
        var files = [];
        var index = 0;

        var read = function(f) {
            if (f.isFile()) {
                fs.readFile(path.join(__dirname, directory, f.name), { encoding: "utf-8" }, function(err, file) {
                    files.push({
                        filename: path.join(directory, f.name),
                        content: file
                    });
                    if (++index == subs.length)
                        return callback(files)
                })
            } else {
                readAllFiles(path.join(directory, f.name), function(subFiles) {
                    if (subFiles) {
                        for (var f of subFiles)
                            files.push(f);
                    }
                    if (++index == subs.length)
                        return callback(files)
                })
            }
        }

        for (var f of subs) {
            read(f)
        }

    })
}

function readAllFiles(directory, callback) {
    fs.readdir(path.join(__dirname, directory), { withFileTypes: true }, function(err, subs) {
        if (err)
            callback();
        var files = [];
        var index = 0;

        var read = function(f) {
            if (f.isFile()) {
                fs.readFile(path.join(__dirname, directory, f.name), { encoding: "utf-8" }, function(err, file) {
                    files.push({
                        filename: path.join(directory, f.name),
                        content: file
                    });
                    if (++index == subs.length)
                        return callback(files)
                })
            } else {
                readAllFiles(path.join(directory, f.name), function(subFiles) {
                    if (subFiles) {
                        for (var f of subFiles)
                            files.push(f);
                    }
                    if (++index == subs.length)
                        return callback(files)
                })
            }
        }

        for (var f of subs) {
            read(f)
        }

    })
}

/*readAllFiles("public", function(files) {
    for (var f of files)
        console.log(f.name)
    //console.log(files)
});*/

function loadExtension(ctx, next) {
    ctx.extend = {};
    ctx.extend.tag = {};
    var exts = path.join(__dirname, "extends")
    fs.readdir(exts, { withFileTypes: true },
        function(err, files) {
            for (var f of files) {
                require(path.join(exts, f.name))(ctx);
            }
            next();
        });
}

function readSource(ctx, next) {

    ctx.locals = {posts:[],pages:[]}

    readAllFiles(ctx.config.source_dir, function(result) {
        Promise.each(result, function(file) {
            return parseSourceFile(ctx, file)
        }).then(result => {
        	ctx.htmlFiles = result;        	
            //console.log(result)
            next()
        });
    });
}

function parseSourceFile(ctx, file) {

    var parsed = yamlFront.loadFront(file.content);
    /*var reg = /^\-\-\-(.+)\-\-\-(.+)?$/
    var front, html;
    console.log(file.content)
    console.log(reg.exec(file.content))/*.replace(reg, function(a, b, c) {
        front = b;
        html = c
    })*/

    file.data = parsed;

    var roo;
    if(file.filename.indexOf((roo = path.join(ctx.config.source_dir,"page"))) == 0){
    	
    } else if(file.filename.indexOf((roo = path.join(ctx.config.source_dir,"post"))) == 0)
    {} else {
    	roo = ctx.config.source_dir;
    }

	file.data.path = file.filename.split(roo)[1].substring(1)
	file.data.path = file.data.path.substr(0,file.data.path.length - 3)

    var reg = /<[^<]+>/g
    if (file.data.__content.match(reg)) {
    	var ext = ejs.render(file.data.__content, ctx.extend.tag);
    	console.log(ext)
        file.data.content = markdown.toHTML(ext)
    }


    var template = path.join(__dirname, "themes", ctx.config.theme, "layout");

    if (file.data.layout == "post") {
        ctx.locals.posts.push(file)
    } else {
        ctx.locals.pages.push(file)
        //if(file.data.path == "index")
        //	file.layout = "index";
    }

    var renderFile = Promise.promisify(ejs.renderFile);

    var access = Promise.promisify(fs.access);

    var data = {
        config: ctx.config,
        page: file.data,
        body: "",
        ...ctx.extend.tag
    };

    var layout = path.join(template, (file.data.layout || "layout") + ".ejs");    

    return access(layout, fs.constants.R_OK).then(function(succ) {

        return renderFile(layout, data, { filename: layout }).then(function(first) {
            //console.log("1 ")
            if (path.basename(layout, ".ejs") != "layout") {
                data.body = first
                layout = path.join(template, "layout.ejs")
                return renderFile(layout, data, { filename: layout }).then(function(final) {
                    //console.log("2 ")
                    file.page = final
                })
            } else file.page = first
        })
    }, function(err) {
        console.log("There's no matching template for "+ file.filename + "'s layout ", file.data.layout)
        layout = path.join(template, "layout.ejs")
        return renderFile(layout, data, { filename: layout }).then(function(page) {
            //console.log("3 " + layout + page)
            file.page = page
        })
    })
}

function readConfig(ctx, next) {

    fs.readFile(path.join(__dirname, "_config.yml"), { encoding: "utf-8" }, function(err, file) {

        ctx.config = yaml.load(file);
        next()

    });
}

function generateHTMLs(ctx, next) {
	//console.log(ctx.locals)
	var pages = [...ctx.locals.pages,...ctx.locals.posts]
	console.log("hexo generating files " + pages.length)

    Promise.each(pages,function(page){
    	//var p = path.join(__dirname,ctx.config.source_dir,page.data.path)
    	var writeFile = Promise.promisify(fs.writeFile)

    	var directory = path.join(__dirname,ctx.config.public_dir);
    	var filePath = path.join(directory,page.data.path)
    	if(page.data.path == "index"){
    		filePath += ".html"
    		console.log(filePath)
    	}
    	else {
    		for(var d of page.data.path.split("\\")){
    			directory = path.join(directory,d);
            	fs.mkdirSync(directory)
    		}
    		filePath = path.join(filePath,"index.html")
    	};

    	console.log(filePath)

    	return writeFile(filePath,
    		page.page).then(function(){
    			console.log(page.data.path)
    		})
    }).then(function(result){
    	next()
    })
}

function serveStatic(ctx, next) {
	var app = express();
	app.use(express.static(__dirname + '/public'))
	require("http").createServer(app).listen(80);
    next()
}

function clean(ctx, next) {
	
function delFile(path, reservePath) {
    if (fs.existsSync(path)) {
        if (fs.statSync(path).isDirectory()) {
            let files = fs.readdirSync(path);
            files.forEach((file, index) => {
                let currentPath = path + "/" + file;
                if (fs.statSync(currentPath).isDirectory()) {
                    delFile(currentPath, reservePath);
                } else {
                    fs.unlinkSync(currentPath);
                }
            });
            if (path != reservePath) {
                fs.rmdirSync(path);
            }
        } else {
            fs.unlinkSync(path);
        }
    }
}
 
delFile(path.join(__dirname,ctx.config.public_dir))
    next()
}

function hexo() {

    var pipelines = {}

    function createPipelines(names) {
        var pre;
        for (var i = names.length - 1; i >= 0; i--) {
            pre = pipelines[names[i]] = pipeline(pre, { id: names[i] })
        }
    }

    createPipelines([
        "config",
    	"clean",
        "extension",
        "source",
        "generate",
        "serve"
    ])

    pipelines["config"].use(readConfig)
    pipelines["clean"].use(clean)
    pipelines["extension"].use(loadExtension)
    pipelines["source"].use(readSource)
    pipelines["generate"].use(generateHTMLs)
    pipelines["serve"].use(serveStatic)




    this.use = function(pattern, middleware) {
        pipelines[pattern].use(middleware);
    }

    this.start = function() {
        pipelines["config"]({})
    }

}



var myHexo = new hexo();
/*myHexo.use("config", function(ctx, next) {
	ctx.title="史上最多"
    console.log("config extension", ctx)
    next()
})*/
///myHexo.start();


var args = process.argv

args.shift()
args.shift()

switch (args.shift()) {
    case "start":
        var myHexo = new hexo();
        myHexo.start()

        break;

    case "new":

        var type = args.shift();
        var name = args.shift()

        var command = require("./command.js")(args)
        var yml = { layout: type, title: name }
        yml = { ...yml, ...command }

        var str = "---\r\n"
        str += yaml.dump(yml);
        str += "---"

        var p = path.join(__dirname, "source", type)

        if (fs.existsSync(p))
            fs.mkdirSync(p)

        fs.writeFileSync(path.join(p, name + ".md"), str);
        //})



        //console.log(yml,str)

        break;
}