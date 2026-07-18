-- 数据库初始化脚本
-- 数据库: test (MySQL 8.0+)
-- 执行前请确保数据库已创建: CREATE DATABASE IF NOT EXISTS test DEFAULT CHARSET utf8mb4;

CREATE TABLE IF NOT EXISTS `ql_rule` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `rule_name` VARCHAR(100) NOT NULL COMMENT '规则名称',
  `canvas_json` LONGTEXT COMMENT '画布内容JSON',
  `ql_expression` TEXT COMMENT 'QLExpress表达式',
  `custom_fields_json` TEXT COMMENT '自定义字段JSON',
  `version` INT DEFAULT 1 COMMENT '版本号',
  `creator` VARCHAR(50) DEFAULT 'admin' COMMENT '创建人',
  `remark` VARCHAR(500) COMMENT '备注',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态 1启用 0禁用',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='规则表';
