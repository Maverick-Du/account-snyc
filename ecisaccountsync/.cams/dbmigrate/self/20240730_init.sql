CREATE TABLE IF NOT EXISTS `tb_sync_job_setting` (
    `id` int(20) unsigned NOT NULL AUTO_INCREMENT,
    `company_id` varchar(20) NOT NULL COMMENT '云文档租户id',
    `sync_type` varchar(20) NOT NULL COMMENT 'FULL_SYNC_JOB-全量同步，INCREMENT_SYNC_JOB-增量同步',
    `sync_time` varchar(20) DEFAULT NULL COMMENT '同步起始时间',
    `end_time` varchar(20) DEFAULT NULL COMMENT '同步结束时间',
    `open` int DEFAULT 0 COMMENT '0-关，1-开',
    `rate` int DEFAULT 10 COMMENT '频率',
    `type` varchar(10) DEFAULT 'min' COMMENT 'min-按分钟  hour-按小时',
    `cron` varchar(20) DEFAULT NULL COMMENT 'cron',
    `ctime` timestamp DEFAULT CURRENT_TIMESTAMP,
    `mtime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE (`company_id`, `sync_type`) COMMENT '唯一索引'
    ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC;

CREATE TABLE IF NOT EXISTS `tb_root_dept_user_temp` (
    `id` int(20) unsigned NOT NULL AUTO_INCREMENT,
    `company_id` varchar(20) NOT NULL COMMENT '云文档租户id',
    `uid` varchar(60) NOT NULL COMMENT '云文档用户ID',
    `ctime` timestamp DEFAULT CURRENT_TIMESTAMP,
    `mtime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE (`uid`, `company_id`) COMMENT '唯一索引'
    ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC;

CREATE TABLE IF NOT EXISTS `tb_lock` (
    `id` int(20) unsigned NOT NULL AUTO_INCREMENT,
    `lock_key` varchar(20) NOT NULL COMMENT '锁唯一键',
    `desc` varchar(200) NOT NULL COMMENT '锁描述',
    `ctime` timestamp DEFAULT CURRENT_TIMESTAMP,
    `mtime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE INDEX `uk_lock_key`(`lock_key`) USING BTREE  COMMENT 'lock_key唯一索引'
    ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC;

CREATE TABLE IF NOT EXISTS `tb_full_sync_task` (
    `id` int(20) unsigned NOT NULL AUTO_INCREMENT,
    `task_id` varchar(20) NOT NULL COMMENT '任务id',
    `company_id` varchar(20) NOT NULL COMMENT '云文档租户id',
    `sync_type` varchar(10) NOT NULL COMMENT '同步类型 auto sync',
    `status` int(11) DEFAULT 10 COMMENT 'status 10-待同步 50-同步中 100-同步成功 -10:取消 -100:失败',
    `operator` varchar(20) NOT NULL COMMENT 'operator',
    `collect_cost` int(11) DEFAULT 0 COMMENT '采集耗时',
    `schedule_time` timestamp DEFAULT CURRENT_TIMESTAMP COMMENT '定时时间',
    `begin_time` timestamp COMMENT '开始时间',
    `end_time` timestamp COMMENT '结束时间',
    `error_msg` varchar(2000) DEFAULT NULL COMMENT 'msg',
    `ctime` timestamp DEFAULT CURRENT_TIMESTAMP,
    `mtime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE INDEX `uk_task_id`(`task_id`) USING BTREE  COMMENT 'task_id唯一索引'
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC;

CREATE TABLE IF NOT EXISTS `tb_full_sync_task_statistics` (
    `id` int(20) unsigned NOT NULL AUTO_INCREMENT,
    `task_id` varchar(20) NOT NULL COMMENT '任务id',
    `company_id` varchar(20) NOT NULL COMMENT '云文档租户id',
    `total_user` int(11) DEFAULT 0 COMMENT 'total_user',
    `sync_user` int(11) DEFAULT 0 COMMENT 'sync_user',
    `total_dept` int(11) DEFAULT 0 COMMENT 'total_dept',
    `sync_dept` int(11) DEFAULT 0 COMMENT 'sync_dept',
    `total_dept_user` int(11) DEFAULT 0 COMMENT 'total_dept_user',
    `sync_dept_user` int(11) DEFAULT 0 COMMENT 'sync_dept_user',
    `dept_add` int(11) DEFAULT 0 COMMENT 'dept_add',
    `dept_update` int(11) DEFAULT 0 COMMENT 'dept_update',
    `dept_delete` int(11) DEFAULT 0 COMMENT 'dept_delete',
    `dept_move` int(11) DEFAULT 0 COMMENT 'dept_move',
    `user_delete` int(11) DEFAULT 0 COMMENT 'user_delete',
    `user_update` int(11) DEFAULT 0 COMMENT 'user_update',
    `user_add` int(11) DEFAULT 0 COMMENT 'user_add',
    `dept_user_add` int(11) DEFAULT 0 COMMENT 'dept_user_add',
    `dept_user_delete` int(11) DEFAULT 0 COMMENT 'dept_user_delete',
    `dept_user_sort` int(11) DEFAULT 0 COMMENT 'dept_user_sort',
    `user_dept_update` int(11) DEFAULT 0 COMMENT 'user_dept_update',
    `ctime` timestamp DEFAULT CURRENT_TIMESTAMP,
    `mtime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE INDEX `uk_task_id`(`task_id`) USING BTREE  COMMENT 'task_id唯一索引'
    ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC;
