ALTER TABLE tb_full_sync_task MODIFY COLUMN `operator` varchar(100) NOT NULL COMMENT 'operator';
ALTER TABLE tb_full_sync_task ADD COLUMN `scope_version` int(11) DEFAULT NULL COMMENT 'scope_version';

ALTER TABLE tb_full_sync_task_statistics ADD COLUMN `scope_user` int(11) DEFAULT 0 COMMENT 'scope_user';
ALTER TABLE tb_full_sync_task_statistics ADD COLUMN `scope_dept` int(11) DEFAULT 0 COMMENT 'scope_dept';
ALTER TABLE tb_full_sync_task_statistics ADD COLUMN `scope_dept_user` int(11) DEFAULT 0 COMMENT 'scope_dept_user';
ALTER TABLE tb_full_sync_task_statistics ADD COLUMN `user_error` int(11) DEFAULT 0 COMMENT 'user_error';
ALTER TABLE tb_full_sync_task_statistics ADD COLUMN `dept_error` int(11) DEFAULT 0 COMMENT 'dept_error';
ALTER TABLE tb_full_sync_task_statistics ADD COLUMN `dept_user_error` int(11) DEFAULT 0 COMMENT 'dept_user_error';
ALTER TABLE tb_full_sync_task_statistics ADD COLUMN `total_success` int(11) DEFAULT 0 COMMENT 'total_success';
ALTER TABLE tb_full_sync_task_statistics ADD COLUMN `total_error` int(11) DEFAULT 0 COMMENT 'total_error';

ALTER TABLE tb_full_sync_task ADD COLUMN `region_id` varchar(200) DEFAULT "default_region" COMMENT 'region_id';
ALTER TABLE tb_lock ADD COLUMN `region_id` varchar(200) DEFAULT "default_region" COMMENT 'region_id';

CREATE TABLE IF NOT EXISTS `tb_full_sync_scope` (
    `id` int(20) unsigned NOT NULL AUTO_INCREMENT,
    `company_id` varchar(20) NOT NULL COMMENT '云文档租户id',
    `platform_id` varchar(60) NOT NULL COMMENT '平台id, 用来区分多种数据源，platform_id + did 唯一',
    `did` varchar(255) NOT NULL COMMENT '部门id',
    `name` varchar(255) NOT NULL COMMENT '部门名称',
    `check_type` tinyint(4) NOT NULL COMMENT '勾选类型',
    `operator` varchar(100) NOT NULL COMMENT 'operator',
    `status` tinyint(4) NOT NULL COMMENT '0-禁用，1-启用',
    `ctime` timestamp DEFAULT CURRENT_TIMESTAMP,
    `mtime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`) USING BTREE,
    KEY `idx_did` (`did`, `platform_id`, `company_id`, `status`) COMMENT 'did索引'
    ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC;

CREATE TABLE IF NOT EXISTS `tb_full_sync_scope_version` (
    `id` int(20) unsigned NOT NULL AUTO_INCREMENT,
    `company_id` varchar(20) NOT NULL COMMENT '云文档租户id',
    `scope_version` int(11) DEFAULT 1 COMMENT '版本号',
    `ctime` timestamp DEFAULT CURRENT_TIMESTAMP,
    `mtime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE (`company_id`) COMMENT '唯一索引'
    ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC;

CREATE TABLE IF NOT EXISTS `tb_full_sync_del_threshold` (
    `id` int(20) unsigned NOT NULL AUTO_INCREMENT,
    `company_id` varchar(20) NOT NULL COMMENT '云文档租户id',
    `user_del` int(11) DEFAULT 10 COMMENT '用户删除阈值',
    `dept_del` int(11) DEFAULT 10 COMMENT '用户删除阈值',
    `dept_user_del` int(11) DEFAULT 10 COMMENT '部门用户关系删除阈值',
    `operator` varchar(100) NOT NULL COMMENT 'operator',
    `ctime` timestamp DEFAULT CURRENT_TIMESTAMP,
    `mtime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE (`company_id`) COMMENT '唯一索引'
    ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC;

CREATE TABLE IF NOT EXISTS `tb_full_sync_user_record` (
    `id` int(20) unsigned NOT NULL AUTO_INCREMENT,
    `task_id` varchar(20) NOT NULL COMMENT '任务id',
    `company_id` varchar(20) NOT NULL COMMENT '云文档租户id',
    `account` varchar(255) NOT NULL COMMENT 'account',
    `name` varchar(255) NOT NULL COMMENT '名称',
    `platform_id` varchar(60) NOT NULL COMMENT '平台id, 用来区分多种数据源，platform_id + uid 唯一',
    `uid` varchar(255) NOT NULL COMMENT 'uid',
    `wps_did` varchar(255) DEFAULT NULL COMMENT '云文档部门ID',
    `abs_path` varchar(2048) DEFAULT NULL COMMENT '部门路径',
    `update_type` varchar(100) NOT NULL COMMENT '修改类型',
    `status` tinyint(4) NOT NULL COMMENT '1: 成功  -1：失败  0：警告',
    `msg` varchar(2048) DEFAULT NULL COMMENT '错误原因',
    `ctime` timestamp DEFAULT CURRENT_TIMESTAMP,
    `mtime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`) USING BTREE,
    KEY `idx_task_id` (`task_id`, `status`) COMMENT 'task_id索引'
    ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC;

CREATE TABLE IF NOT EXISTS `tb_full_sync_dept_record` (
    `id` int(20) unsigned NOT NULL AUTO_INCREMENT,
    `task_id` varchar(20) NOT NULL COMMENT '任务id',
    `company_id` varchar(20) NOT NULL COMMENT '云文档租户id',
    `name` varchar(255) NOT NULL COMMENT '名称',
    `platform_id` varchar(60) NOT NULL COMMENT '平台id, 用来区分多种数据源，platform_id + did 唯一',
    `did` varchar(255) NOT NULL COMMENT 'did',
    `wps_pid` varchar(255) DEFAULT NULL COMMENT '云文档pid',
    `abs_path` varchar(2048) DEFAULT NULL COMMENT '部门路径',
    `update_type` varchar(100) NOT NULL COMMENT '修改类型',
    `status` tinyint(4) NOT NULL COMMENT '1: 成功  -1：失败  0：警告',
    `msg` varchar(2048) DEFAULT NULL COMMENT '错误原因',
    `ctime` timestamp DEFAULT CURRENT_TIMESTAMP,
    `mtime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`) USING BTREE,
    KEY `idx_task_id` (`task_id`, `status`) COMMENT 'task_id索引'
    ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC;

CREATE TABLE IF NOT EXISTS `tb_full_sync_dept_user_record` (
    `id` int(20) unsigned NOT NULL AUTO_INCREMENT,
    `task_id` varchar(20) NOT NULL COMMENT '任务id',
    `company_id` varchar(20) NOT NULL COMMENT '云文档租户id',
    `account` varchar(255) NOT NULL COMMENT 'account',
    `name` varchar(255) NOT NULL COMMENT '名称',
    `platform_id` varchar(60) NOT NULL COMMENT '平台id, 用来区分多种数据源，platform_id + uid 唯一',
    `uid` varchar(255) NOT NULL COMMENT 'uid',
    `wps_did` varchar(255) NOT NULL COMMENT '云文档did',
    `abs_path` varchar(2048) DEFAULT NULL COMMENT '部门路径',
    `update_type` varchar(100) NOT NULL COMMENT '修改类型',
    `status` tinyint(4) NOT NULL COMMENT '1: 成功  -1：失败  0：警告',
    `msg` varchar(2048) DEFAULT NULL COMMENT '错误原因',
    `ctime` timestamp DEFAULT CURRENT_TIMESTAMP,
    `mtime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`) USING BTREE,
    KEY `idx_task_id` (`task_id`, `status`) COMMENT 'task_id索引'
    ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC;
