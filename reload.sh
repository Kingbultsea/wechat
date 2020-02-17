#!/bin/bash
NODE=`which node`
PID_FILE="./koa.pid"
LOG_NAME="./koa.log"
PATH=`/bin/pwd`
INDEX="$PATH/index.js"
ACTION=$1
#echo $INDEX
start(){
if [ -f $PID_FILE ];then
   echo " process is  already staring! "
else
  echo "node start ======"
  $NODE $INDEX >> $LOG_NAME 2>&1 &  #将调试信息写入文件，并以后台的方式运行
  if [ $? -eq 0 ];then
   echo $! > $PID_FILE #将当前进程写入pid文件
    echo "node start successfully!"
  else
    echo "node start failed!"
  fi
fi
}

stop(){
if [ ! -f $PID_FILE ];then
  echo "node is not start yet!"
else
  echo "node stop ======"
  /bin/kill `/bin/cat $PID_FILE`
  /bin/rm -rf $PID_FILE
  if [ $? -eq 0 ];then
    echo "node stopped successfully!"
  else
    echo "node stopped failed!"
  fi
fi
}

case $ACTION in
start)
        start
;;
stop)
        stop
;;
reload)
        stop
        /bin/sleep 3
        start
;;
*)
    echo "$0 Usage: [start|stop|reload]"
;;
esac
