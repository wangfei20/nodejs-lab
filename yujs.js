const yu = (template)=> {
  let fn = null
  return (data)=> {
    if(fn) return(fn(data))
    let str = `{${Object.keys(data).join(",")}}`
    fn = new Function(str, `return \`${template}\``);
    return fn(data)
  }
}
let render = yu(template)
render(data)
render(data)
render(data)
