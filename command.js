module.exports = function(a) {
    var args = a || process.argv

    var command = {};
    
    for (var i = 0; i < args.length; i++) {
        args[i].indexOf("-") == 0 ? command[args[i].substr(1)] = (args[i + 1].indexOf("-") == 0 ? true : args[i + 1]) : null
    }

    return command
}