ALTER TABLE `tb_full_sync_user_record` ADD COLUMN `err_type` varchar(255) DEFAULT NULL COMMENT '错误类型';
ALTER TABLE `tb_full_sync_dept_record` ADD COLUMN `err_type` varchar(255) DEFAULT NULL COMMENT '错误类型';
ALTER TABLE `tb_full_sync_dept_user_record` ADD COLUMN `err_type` varchar(255) DEFAULT NULL COMMENT '错误类型';