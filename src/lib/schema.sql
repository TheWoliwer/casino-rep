-- Casino Takip MySQL Tablo Yapısı
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `casinos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `fee_type` ENUM('percent', 'fixed', 'none') DEFAULT 'percent',
  `fee_rate` DECIMAL(10, 2) DEFAULT 0.00,
  `fee_currency` VARCHAR(10) DEFAULT 'TRY',
  `sort_order` INT DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `casino_cols` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `casino_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `amount` DECIMAL(15, 2) DEFAULT 0.00,
  `currency` VARCHAR(10) DEFAULT 'TRY',
  `monthly` TINYINT DEFAULT 1 COMMENT '0=tek seferlik, 1=aylik, 2=yillik',
  `sort_order` INT DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_casino_cols_casino_id` (`casino_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `fee_rows` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `casino_id` INT NOT NULL,
  `year` INT NOT NULL,
  `month` INT NOT NULL,
  `turnover` DECIMAL(15, 2) DEFAULT 0.00,
  `fee_amount` DECIMAL(15, 2) DEFAULT 0.00,
  `paid_amount` DECIMAL(15, 2) DEFAULT 0.00,
  `status` INT DEFAULT 0,
  `note` TEXT,
  `debt_items` JSON NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_fee_rows_lookup` (`casino_id`, `year`, `month`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `col_entries` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `col_id` INT NOT NULL,
  `year` INT NULL,
  `month` INT NULL,
  `amount` DECIMAL(15, 2) NULL,
  `status` INT DEFAULT 0,
  `note` TEXT,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_col_entries_lookup` (`col_id`, `year`, `month`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `transactions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `fee_row_id` INT NOT NULL,
  `paid_amount` DECIMAL(15, 2) DEFAULT 0.00,
  `note` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_transactions_fee_row` (`fee_row_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `expenses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `year` INT NOT NULL,
  `month` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `amount` DECIMAL(15, 2) DEFAULT 0.00,
  `currency` VARCHAR(10) DEFAULT 'TRY',
  `note` TEXT,
  `casino_id` INT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_expenses_lookup` (`year`, `month`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `settings` (
  `k` VARCHAR(100) PRIMARY KEY,
  `v` LONGTEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Varsayılan ayarlar
INSERT INTO `settings` (`k`, `v`) VALUES
('default_currency', 'TRY'),
('debt_presets', '["MAKİNA KİRASI","DEPOZİTO","SERVER ÜCRETİ","RTP","KİRA","BAKIM","FEE","SABİT-FEE","DEVREDEN BORÇ","DİJİTAL"]'),
('password', '3636')
ON DUPLICATE KEY UPDATE `v` = VALUES(`v`);

SET FOREIGN_KEY_CHECKS = 1;
