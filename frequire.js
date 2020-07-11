var path = require("path");
var fs = require("fs");

function frequire(file){

    var result = fs.readFileSync(path.join(__dirname, file), 'utf-8');
    var mod = new Function("exports","module","require",
    	result + "var i;for(i in exports){break;}if(i == null){return module.exports;}else {return exports;}");
        //return mod({},{"exports":{}});
    var obj = {mod};
    return obj.mod({},{"exports":{}},frequire);
}


module.exports = frequire;
 