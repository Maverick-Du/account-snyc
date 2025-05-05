#!/bin/bash
source /etc/profile
set -x
node -v
npm -v

OUT_DIR="./dist" # 产物输出目录

if [ $# -eq 0 ]; then
  echo '!!!参数为空,使用默认参数' ${OUT_DIR}
fi
while getopts ":o:" opt
do
    case $opt in
        o)
        echo "参数output dir的值$OPTARG"
        OUT_DIR=$OPTARG
        ;;
        ?)
        echo "未知参数"
        exit -1;;
    esac
done
echo "input: " ${OUT_DIR}

npm config set ecis-project:out $OUT_DIR
npm config set strict-ssl false
npm config set registry  https://registry.npmmirror.com
type pnpm
if [ $? -ne 0 ];then
    npm install pnpm -g
    echo 'pnpm package installed'
fi
pnpm config set ecis-project:out $OUT_DIR
SDK_DIST="/build"
SDK_CWD=$(cd "$(dirname "$0")"; pwd)
cd $SDK_CWD
export SDK_BUILD_PATH=$SDK_CWD$SDK_DIST
echo $SDK_BUILD_PATH
pnpm install
start_time=$(date +%s)
echo "pnpm build..."
pnpm run build
echo "pnpm build done: $[$(date +%s)-$start_time]s"

