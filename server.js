var http = require('http')
var fs = require('fs')
var url = require('url')
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

  console.log('有个傻子发请求过来啦！路径（带查询参数）为：' + pathWithQuery)


  if(path === '/register' && method === 'POST'){
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
      response.end();
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
