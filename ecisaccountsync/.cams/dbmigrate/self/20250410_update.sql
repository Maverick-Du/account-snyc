ALTER TABLE `tb_lock` ADD COLUMN `etime` bigint(20) DEFAULT 0 COMMENT '锁过期时间，单位为秒';
