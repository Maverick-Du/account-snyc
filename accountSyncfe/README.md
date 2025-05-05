## 须知
此版本为v7模版，勿用做v6

### 本地开发
参考文档：[本地开发](https://p.wpseco.cn/wiki/doc/62b02eaf68a4a821270e7f7d)

### 环境要求
1. node 版本推荐 v16.20.2

### 目录说明
```
plugin
├─ .cams -> 服务读取配置目录无需修改                      
│  ├─ template.json -> 服务配置文件无需修改            
├─ dist -> 输出产物目录                        
│  ├─ pack -> 输出的文件必须在pack目录下-服务端读取目录                    
│  │  ├─ index.html            
│  │  ├─ plugin.a65001b.js     
│  │  └─ web.2ad0d79.js        
│  └─ config.json -> 输出的配置文件-是根目录的config.json加上webpack注入的entrys字段              
├─ lib                         
│  ├─ dll -> webpack的dll配置文件                     
│  │  ├─ common-manifest.json  
│  │  └─ react-manifest.json   
│  └─ tgz                      
│     └─ ecis-jssdk-1.0.1.tgz -> sdk的d.ts包  
├─ scripts -> webpack编译目录                     
│  ├─ create-config-plugin.js -> 往根目录的config.json中注入插件
│  ├─ create-html-plugin.js -> 往web目录中的html中注入环境变量    
│  ├─ css-check-loader.js -> 校验css插件  
│  ├─ polyfill.js      
│  ├─ webpack.config.js        
│  └─ webpack.prod.js          
├─ src -> 代码主目录    
├─ ├─assets -> 静态资源目录
├─ ├─components -> 组件目录插件按需自行决定是否删除                 
│  ├─ web -> 独立页面代码主目录                          
│  │  ├─ bootstrap.tsx -> 业务逻辑入口文件         
│  │  ├─ index.tsx -> 独立页面入口文件         
│  │  └─ template.html -> 模板html      
│  ├─ index.global.css -> 全局css样式         
│  ├─ index.tsx -> 非页面插件入口文件                
│  └─ sdk.ts -> 创建sdk实例                   
├─ types -> ts 全局类型目录
├─ .env -> 全局环境变量                     
├─ build.sh -> 线上构建脚本                   
├─ config.json -> 插件配置文件                
├─ tsconfig.json -> ts配置文               
```

### 前置配置(注意)
1. 在根目录中.env文件写入当前插件信息
```
ECIS_APPID = '应用id'
ECIS_APPNAME = '应用端名称' // 由插件自己取名，贴合项目即可
ECIS_TYPE = 'web'
ECIS_COMPONENT_ID = '组件id'
```
2. 在独立页面入口文件代码结构保持一致，其他按照需求自行更改
### 安装依赖

> 必须使用pnpm安装依赖 !!!

```bash
pnpm i
```
### 启动开发服务器
```bash
# 开发devServer,访问 http://localhost:3600/index.js
pnpm start
```

### 生产构建

```bash
pnpm build
```

### 构建
- pnpm run build 构建原始代码在build目录

