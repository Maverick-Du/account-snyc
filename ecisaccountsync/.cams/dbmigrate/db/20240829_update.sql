ALTER TABLE tb_las_user ADD COLUMN `check_type` tinyint(4) DEFAULT 0 NOT NULL COMMENT '1-勾选 0-未勾选';
ALTER TABLE tb_las_user MODIFY COLUMN `employment_status` varchar(60) DEFAULT 'notactive' NOT NULL COMMENT '就职状态[active, notactive, disabled]';
ALTER TABLE tb_las_department ADD COLUMN `check_type` tinyint(4) DEFAULT 0 NOT NULL COMMENT '1-勾选 0-未勾选';
ALTER TABLE tb_las_department ADD COLUMN `type` varchar(255) DEFAULT NULL COMMENT '类型, 仅支持小写字母和下划线组成';
ALTER TABLE tb_las_department_user ADD COLUMN `check_type` tinyint(4) DEFAULT 0 NOT NULL COMMENT '1-勾选 0-未勾选';

ALTER TABLE tb_las_user_increment MODIFY COLUMN `operator` varchar(100) DEFAULT '系统' NOT NULL COMMENT 'operator';
ALTER TABLE tb_las_department_increment MODIFY COLUMN `operator` varchar(100) DEFAULT '系统' NOT NULL COMMENT 'operator';
ALTER TABLE tb_las_department_increment ADD COLUMN `type` varchar(255) DEFAULT NULL COMMENT '类型, 仅支持小写字母和下划线组成';
ALTER TABLE tb_las_department_user_increment MODIFY COLUMN `operator` varchar(100) DEFAULT '系统' NOT NULL COMMENT 'operator';

alter table tb_las_department add INDEX `idx_task_company`(`task_id`, `third_company_id`);
alter table tb_las_department_user add INDEX `idx_task_company`(`task_id`, `third_company_id`);

