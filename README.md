#### 创建mysql镜像
如果不使用镜像，可以直接导入当前目录下的wechat_supervisory.sql,再配置db.config.json文件
```shell script
# 拉取mysql镜像
docker pull mysql

# 创建镜像
docker run -di --name CONTAINERNAME -p 33306:3306 -e MYSQL_ROOT_PASSWORD=123456 mysql

# 进入mysql
docker exec -it CONTAINERNAME /bin/bash

# 登录mysql
mysql -u root -p

# navicat 远程连接docker mysql

# 授权
GRANT ALL ON *.* TO 'root'@'%';

# 刷新权限
flush privileges

# 更改加密规则
ALTER USER 'root'@'localhost' IDENTIFIED BY 'password' PASSWORD EXPIRE NEVER;

# 更新 root 用户密码
ALTER USER 'root'@'%' IDENTIFIED WITH mysql_native_password BY '123456';

# 刷新权限
flush privileges;

使用native cat 连接数据库 是否成功
```

#### 数据库文件配置
> 数据库文件配置在 ./db.config.json

#### 创建机器人监测
```shell script
docker image build ./ -t wechat:latest

docker-compose up

# 打开二维码进行微信登录
```

#### 查询任意接口,是否成功
```shell script
curl 127.0.0.1:8080/nowdata
```




