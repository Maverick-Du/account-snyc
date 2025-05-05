CREATE TABLE IF NOT EXISTS `tb_full_sync_task_analyse` (
  `id` int(20) unsigned NOT NULL AUTO_INCREMENT,
  `company_id` varchar(20) NOT NULL COMMENT '云文档租户id',
  `status` tinyint(4) NOT NULL COMMENT  '统计分析状态',
  `task_id` varchar(20) NOT NULL COMMENT '任务id',
  `operator` varchar(100) NOT NULL COMMENT 'operator',
  `err_msg` varchar(2000) DEFAULT NULL COMMENT '分析失败原因',
  `ctime` timestamp DEFAULT CURRENT_TIMESTAMP,
  `mtime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE (`task_id`, `company_id`) COMMENT '唯一索引'
 ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC COMMENT='全量同步任务分析表';

CREATE TABLE IF NOT EXISTS `tb_full_sync_mid_analyse_record` (
  `id` int(20) unsigned NOT NULL AUTO_INCREMENT,
  `task_id` varchar(20) NOT NULL COMMENT '任务id',
  `company_id` varchar(20) NOT NULL COMMENT '云文档租户id',
  `total_user` int(20) DEFAULT 0 COMMENT '用户采集表总用户记录数',
  `sync_user` int(20) DEFAULT 0 COMMENT '可同步用户数',
  `total_dept` int(20) DEFAULT 0 COMMENT '部门采集表总部门记录数',
  `sync_dept` int(20) DEFAULT 0 COMMENT '可同步部门数',
  `total_dept_user` int(20) DEFAULT 0 COMMENT '用户部门关系采集表总用户部门关系记录数',
  `drift_dept` int(20) DEFAULT 0 COMMENT '游离部门数',
  `drift_dept_user` int(20) DEFAULT 0 COMMENT '游离部门下用户数',
  `drift_user` int(20) DEFAULT 0 COMMENT '游离用户数',
  `select_all` tinyint(1) DEFAULT 0 COMMENT '是否同步全部部门全选 0:否 1:是',
  `select_total_user` int(20) DEFAULT 0 COMMENT '勾选同步用户数',
  `select_total_dept` int(20) DEFAULT 0 COMMENT '勾选同步部门数',
  `ctime` timestamp DEFAULT CURRENT_TIMESTAMP,
  `mtime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
 ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC COMMENT='全量同步任务中间表分析记录表';

CREATE TABLE IF NOT EXISTS `tb_full_sync_err_analyse_record` (
  `id` int(20) unsigned NOT NULL AUTO_INCREMENT,
  `task_id` varchar(20) NOT NULL COMMENT '任务id',
  `company_id` varchar(20) NOT NULL COMMENT '云文档租户id',
  `sync_tb_type` varchar(100) NOT NULL COMMENT '同步表类型 用户表 user 部门表 dept 部门用户关系表 dept_user',
  `operate_type` varchar(100) NOT NULL COMMENT '同步操作类型',
  `err_type` varchar(100) NOT NULL COMMENT '错误类型',
  `extra` varchar(4000) DEFAULT NULL COMMENT '冗余字段，以json形式存储,最长4000字符长度',
  `count` int(20) DEFAULT 0 COMMENT '错误数量',
  `ctime` timestamp DEFAULT CURRENT_TIMESTAMP,
  `mtime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
 ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC COMMENT='全量同步失败原因分析记录表';