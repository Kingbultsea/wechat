
#判断输入的第一个变量是否是stop
if [ "$1"x = "stop"x ]; then
#是就执行下面代码
	echo "stop"
#获取端口7001占用的线程pid
	pids=$(netstat -nlp | grep :8080 | awk '{print $7}' | awk -F"/" '{ print $1 }')
#循环得到的结果
	for pid in $pids
	do
	 echo  $pid
#结束线程
	 kill -9  $pid
	done
#不是就执行启动
else
	echo "start"
        cd  /home/admin/test-node-egg/
	 npm start
        echo "start ok"
fi
