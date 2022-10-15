# 用json模拟数据库，读写数据

# 注册用户功能实现过程
```test.js```相当于本地的```js```，```server.js```相当于服务器
 1. 先写出来一个```form```，让用户将自己的```name```和```password```填入，一个按钮用来提交```form```表单的数据；
```
<form id="registerForm">
  <div>
      <label for="">用户名<input type="text" name="name"></label>
  </div>
  <div>
      <label for="">密码<input type="password" name="password"></label>
  </div>
  <div>
      <button type="submit">注册</button>
  </div>
</form>
```
2. 监听```submit```事件，当用户输入完成点击注册按钮之后，我们需要从用户提交的数据中拿到```name```和```password```然后发送```POST```请求，拿到的数据就位于请求体中。
```
$form.on('submit', (e) => {
    //关掉默认
    e.preventDefault()
    const name = $form.find('input[name=name]').val()
    const password = $form.find('input[name=password]').val()
    console.log(name, password)
    //发起ajax请求,注册，成功之后执行then(跳转到登录页)
    $.ajax({
        method: 'POST',
        url: '/register',
        contentType: 'text/json; charset=UTF-8',
        // data: JSON.stringify({ name: name, password: password })
        data: JSON.stringify({ name, password })
    })
})
```
3. 后端```server.js```接收```POST```请求（根据```url```），获取上传数据中的```name```和```password```，再存入数据库即可。
```
if(path === '/register' && method === 'POST'){
  response.setHeader('Content-Type', 'text/html; charset=utf-8')
  //获取现有数据库中的数据并转成数组
  const userArray = JSON.parse(fs.readFileSync('./db/users.json'))
  console.log('数据库现有的数据：'+userArray)
  const array = []
  request.on('data',(chunk)=>{  //监听请求传递数据，上传数据事件:data,
    array.push(chunk)
  })
  //数据上传完毕，存入数据库
  request.on('end', ()=>{
    const string = Buffer.concat(array).toString()   // console.log(typeof string)
    const obj = JSON.parse(string)    // console.log(obj.name); // console.log(obj.password)
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
}
```
4. 用户注册完成之后，跳转到登录页面，这是在发送```ajax```请求之后做的事情：
```
$.ajax({
    method: 'POST',
    url: '/register',
    contentType: 'text/json; charset=UTF-8',
    // data: JSON.stringify({ name: name, password: password })
    data: JSON.stringify({ name, password })
}).then(() => {
    alert('恭喜注册成功')
    //跳转到登录页
    location.href = './sign_in.html'
}, () => { })
```



# 启动
```
node server.js 8888
```
