ALTER TABLE tb_las_department_user_increment ADD COLUMN `dids` varchar(5000) DEFAULT NULL COMMENT 'dids, JSONArray, [{"did": 1, "order": 1}]';
ALTER TABLE tb_las_user MODIFY COLUMN `phone` varchar(200) DEFAULT NULL COMMENT '手机号';
ALTER TABLE tb_las_user MODIFY COLUMN `telephone` varchar(200) DEFAULT NULL COMMENT '座机号';
ALTER TABLE tb_las_user_increment MODIFY COLUMN `phone` varchar(200) DEFAULT NULL COMMENT '手机号';
ALTER TABLE tb_las_user_increment MODIFY COLUMN `telephone` varchar(200) DEFAULT NULL COMMENT '座机号';
ALTER TABLE tb_las_department MODIFY COLUMN `order` int DEFAULT 0 COMMENT '排序';
