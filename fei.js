const fs = require('fs');
const path = require('path');

function render(template){
    template = "return `" + template + "`"
    return (props)=>{
        const render = new Function(Object.keys(props).join(', '),template)
        return render.apply(null, Object.values(props))
    }
}
