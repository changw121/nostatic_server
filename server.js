var http = require('http')
var fs = require('fs')
var url = require('url')
const { getHashes } = require('crypto')
const { json } = require('stream/consumers')
var port = process.argv[2]

if(!port){
  console.log('请指定端口号好不啦？\nnode server.js 8888 这样不会吗？')
  process.exit(1)
}
var server = http.createServer(function(request, response){
  var parsedUrl = url.parse(request.url, true)
  var pathWithQuery = request.url 
  var queryString = ''
  if(pathWithQuery.indexOf('?') >= 0){ queryString = pathWithQuery.substring(pathWithQuery.indexOf('?')) }
  var path = parsedUrl.pathname
  var query = parsedUrl.query
  var method = request.method

  /******** 从这里开始看，上面不要看 ************/
  const session = JSON.parse(fs.readFileSync('./session.json').toString())
  console.log('有个傻子发请求过来啦！路径（带查询参数）为：' + pathWithQuery)

  if(path === '/sign_in' && method === 'POST'){
    //读取现有数据库中的数据
    const userArray = JSON.parse(fs.readFileSync('./db/users.json'))
    const array = []
    request.on('data',(chunk)=>{  //监听请求传递数据，上传数据事件:data,
      array.push(chunk)
    })
    //数据上传完毕，存入数据库
    request.on('end', ()=>{
      const string = Buffer.concat(array).toString()   // console.log(typeof string)
      const obj = JSON.parse(string)    // name password
      //看array里面有没有和obj里面的name、password一样的
      const user = userArray.find((user)=>user.name===obj.name && user.password===obj.password)
      if(user === undefined){
        //如果find函数返回的是undefined则说明没有匹配的数据
        response.setHeader('Content-Type', 'text/json; charset=utf-8')
        response.statusCode = 400
        response.end(`{"errorCode": 4001}`)  //失败返回一个json
      } else{
        //如果匹配成功即可登录
        response.statusCode = 200
        //如果登录成功就发一张进入home页面的门票cookie  用法mdn set cookie
        // response.setHeader("Set-Cookie", "logined=1; HttpOnly")  //前端访问不到cookie
        // response.setHeader("Set-Cookie", `user_id=${user.id}; HttpOnly`)
        //给user_id加密
        const random = Math.random()
        session[random] = {user_id: user.id}
        fs.writeFileSync('./session.json', JSON.stringify(session))
        response.setHeader("Set-Cookie", `session_id=${random}; HttpOnly`)  
      }
      response.end()
    })  
  } else if(path === '/home.html'){
    //先检查是否有门票cookie再放行
    const cookie = request.headers["cookie"]  // console.log(request.headers) //nodejs文档  
    // console.log(cookie)  //logined=1; user_id=3
    // let userId
    let sessionId
    try{
      sessionId = cookie.split(";").filter(s => s.indexOf('session_id=')>=0)[0].split("=")[1]  //console.log着写出来的
    } catch(error){}
    // if(cookie === 'Webstorm-d0809e0=ca879fe2-f4b6-4414-99ec-49ee40bd9730; logined=1'){  // console.log(cookie)  //登录过cookie为我们设置的值，没有登录过为undefined
    if(sessionId && session[sessionId]) { 
      const userId = session[sessionId].user_Id
      const userArray = JSON.parse(fs.readFileSync("./db/users.json"));
      const user = userArray.find(user=>user.id === userId)
      const homeHtml = fs.readFileSync("./public/home.html").toString();
      let string = ''
      if(user){
        string = homeHtml.replace('{{loginStatus}}', '已登录').replace("{{user.name}}", user.name)
      }
      response.write(string)
    } else {
      const homeHtml = fs.readFileSync("./public/home.html").toString();
      const string = homeHtml.replace('{{loginStatus}}', '未登录').replace("{{user.name}}", "")
      response.write(string)
    }
    response.end()
  } else if(path === '/register' && method === 'POST'){
    response.setHeader('Content-Type', 'text/html; charset=utf-8')
    //获取现有数据库中的数据并转成数组
    const userArray = JSON.parse(fs.readFileSync('./db/users.json'))
    console.log('数据库现有的数据：'+userArray)
    const array = []
    request.on('data',(chunk)=>{  //监听请求传递数据，上传数据事件:data,
      array.push(chunk)
    })
    //数据上传完毕，存入数据库
    request.on('end', ()=>{
      const string = Buffer.concat(array).toString()   // console.log(typeof string)
      const obj = JSON.parse(string)    // console.log(obj.name); // console.log(obj.password)
      const lastUser = userArray[userArray.length-1]
      const newUser = {
        //id为数据库已有用户中最后一个用户的id+1, 还要判断最后一个用户是否存在
        id: lastUser ? lastUser.id+1 : 1,
        name: obj.name,
        password: obj.password
      }
      console.log(typeof newUser)
      //将数据存进数组再转成字符串存进数据库
      userArray.push(newUser)
      fs.writeFileSync('./db/users.json',JSON.stringify(userArray))
      response.end()
    })     
  } else{
    response.statusCode = 200
    //默认首页
    const filepath = path === '/' ? '/index.html' : path
    //   console.log(filepath.lastIndexOf('.'))
    const index = filepath.lastIndexOf('.')
    const suffix = filepath.substring(index)  //suffix后缀
    //   console.log(h)
    //哈希  
    const fileTypes = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.png': 'image/png',
      '.jpg': 'image/jpeg'
    }
    response.setHeader('Content-Type', `${fileTypes[suffix] || 'text/html'};charset=utf-8`)
    let content
    try{
      content = fs.readFileSync(`./public${filepath}`)
    } catch(error){
      content = '文件不存在呀朋友'
      response.statusCode = 404
    }
    response.write(content)
    response.end()
  } 
  /******** 代码结束，下面不要看 ************/
})

server.listen(port)
console.log('监听 ' + port + ' 成功\n请用在空中转体720度然后用电饭煲打开 http://localhost:' + port)
