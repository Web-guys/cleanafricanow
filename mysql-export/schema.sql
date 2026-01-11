-- =====================================================
-- CleanAfricaNow MySQL Schema Export
-- Generated from PostgreSQL/Supabase schema
-- Compatible with MySQL 8.0+ / MariaDB 10.5+
-- =====================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';

-- =====================================================
-- ENUMS (MySQL uses ENUM type directly)
-- =====================================================

-- Note: In MySQL, ENUMs are defined inline with the column

-- =====================================================
-- USERS TABLE (replaces auth.users)
-- =====================================================

CREATE TABLE IF NOT EXISTS `users` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `email_confirmed_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `last_sign_in_at` TIMESTAMP NULL,
    `raw_user_meta_data` JSON,
    `is_active` BOOLEAN DEFAULT TRUE,
    INDEX `idx_users_email` (`email`),
    INDEX `idx_users_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- USER SESSIONS (for JWT token management)
-- =====================================================

CREATE TABLE IF NOT EXISTS `user_sessions` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `user_id` CHAR(36) NOT NULL,
    `token` VARCHAR(500) NOT NULL,
    `refresh_token` VARCHAR(500) NULL,
    `expires_at` TIMESTAMP NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_sessions_user_id` (`user_id`),
    INDEX `idx_sessions_token` (`token`(255)),
    INDEX `idx_sessions_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- USER ROLES
-- =====================================================

CREATE TABLE IF NOT EXISTS `user_roles` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `user_id` CHAR(36) NOT NULL,
    `role` ENUM('admin', 'municipality', 'citizen', 'tourist', 'ngo', 'volunteer', 'partner') NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `unique_user_role` (`user_id`, `role`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_user_roles_user_id` (`user_id`),
    INDEX `idx_user_roles_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- CITIES
-- =====================================================

CREATE TABLE IF NOT EXISTS `cities` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `country` VARCHAR(100) NOT NULL DEFAULT 'Morocco',
    `region` VARCHAR(255) NULL,
    `latitude` DECIMAL(10, 6) NOT NULL,
    `longitude` DECIMAL(10, 6) NOT NULL,
    `population` INT NULL,
    `is_municipality` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_cities_name` (`name`),
    INDEX `idx_cities_country` (`country`),
    INDEX `idx_cities_region` (`region`),
    INDEX `idx_cities_coords` (`latitude`, `longitude`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- PROFILES
-- =====================================================

CREATE TABLE IF NOT EXISTS `profiles` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `full_name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(50) NULL,
    `avatar_url` TEXT NULL,
    `bio` TEXT NULL,
    `city_id` CHAR(36) NULL,
    `impact_score` INT DEFAULT 0,
    `reports_count` INT DEFAULT 0,
    `preferred_language` VARCHAR(10) DEFAULT 'en',
    `is_active` BOOLEAN DEFAULT TRUE,
    `last_login_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON DELETE SET NULL,
    INDEX `idx_profiles_city` (`city_id`),
    INDEX `idx_profiles_impact` (`impact_score`),
    INDEX `idx_profiles_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- ORGANIZATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS `organizations` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `type` ENUM('municipality', 'ngo', 'government', 'private', 'international') NOT NULL,
    `description` TEXT NULL,
    `email` VARCHAR(255) NULL,
    `phone` VARCHAR(50) NULL,
    `address` TEXT NULL,
    `website` VARCHAR(255) NULL,
    `logo_url` TEXT NULL,
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_organizations_type` (`type`),
    INDEX `idx_organizations_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- ORGANIZATION MEMBERS
-- =====================================================

CREATE TABLE IF NOT EXISTS `organization_members` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `organization_id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `role` VARCHAR(50) DEFAULT 'member',
    `is_active` BOOLEAN DEFAULT TRUE,
    `joined_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `unique_org_member` (`organization_id`, `user_id`),
    FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_org_members_org` (`organization_id`),
    INDEX `idx_org_members_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- ORGANIZATION TERRITORIES
-- =====================================================

CREATE TABLE IF NOT EXISTS `organization_territories` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `organization_id` CHAR(36) NOT NULL,
    `city_id` CHAR(36) NOT NULL,
    `assigned_by` CHAR(36) NULL,
    `assigned_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `unique_org_territory` (`organization_id`, `city_id`),
    FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON DELETE CASCADE,
    INDEX `idx_org_territories_org` (`organization_id`),
    INDEX `idx_org_territories_city` (`city_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- REPORTS
-- =====================================================

CREATE TABLE IF NOT EXISTS `reports` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `user_id` CHAR(36) NULL,
    `category` ENUM('waste', 'pollution', 'danger', 'noise', 'water', 'air', 
                    'illegal_dumping', 'deforestation', 'water_pollution', 'sewage',
                    'chemical_waste', 'medical_waste', 'electronic_waste', 
                    'construction_debris', 'agricultural_waste', 'oil_spill', 
                    'wildlife_harm', 'other') NOT NULL,
    `description` TEXT NOT NULL,
    `latitude` DECIMAL(10, 6) NOT NULL,
    `longitude` DECIMAL(10, 6) NOT NULL,
    `city_id` CHAR(36) NULL,
    `status` ENUM('pending', 'in_progress', 'resolved', 'assigned', 'rejected', 'verified') DEFAULT 'pending',
    `priority` ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    `photos` JSON,
    `sla_due_date` TIMESTAMP NULL,
    `verified_at` TIMESTAMP NULL,
    `verified_by` CHAR(36) NULL,
    `resolved_at` TIMESTAMP NULL,
    `resolved_by` CHAR(36) NULL,
    `ai_priority_score` DECIMAL(5, 2) NULL,
    `ai_duplicate_of` CHAR(36) NULL,
    `environmental_impact_score` DECIMAL(5, 2) NULL,
    `is_deleted` BOOLEAN DEFAULT FALSE,
    `deleted_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON DELETE SET NULL,
    INDEX `idx_reports_user` (`user_id`),
    INDEX `idx_reports_city` (`city_id`),
    INDEX `idx_reports_status` (`status`),
    INDEX `idx_reports_category` (`category`),
    INDEX `idx_reports_priority` (`priority`),
    INDEX `idx_reports_coords` (`latitude`, `longitude`),
    INDEX `idx_reports_created` (`created_at`),
    INDEX `idx_reports_sla` (`sla_due_date`),
    INDEX `idx_reports_deleted` (`is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- REPORT HISTORY
-- =====================================================

CREATE TABLE IF NOT EXISTS `report_history` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `report_id` CHAR(36) NOT NULL,
    `changed_by` CHAR(36) NULL,
    `action` VARCHAR(50) NOT NULL,
    `old_status` VARCHAR(50) NULL,
    `new_status` VARCHAR(50) NULL,
    `old_data` JSON NULL,
    `new_data` JSON NULL,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`report_id`) REFERENCES `reports`(`id`) ON DELETE CASCADE,
    INDEX `idx_report_history_report` (`report_id`),
    INDEX `idx_report_history_action` (`action`),
    INDEX `idx_report_history_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- REPORT ASSIGNMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS `report_assignments` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `report_id` CHAR(36) NOT NULL,
    `assigned_to` CHAR(36) NOT NULL,
    `assigned_by` CHAR(36) NOT NULL,
    `organization_id` CHAR(36) NULL,
    `status` VARCHAR(50) DEFAULT 'pending',
    `notes` TEXT NULL,
    `due_date` TIMESTAMP NULL,
    `completed_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`report_id`) REFERENCES `reports`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`assigned_by`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE SET NULL,
    INDEX `idx_assignments_report` (`report_id`),
    INDEX `idx_assignments_to` (`assigned_to`),
    INDEX `idx_assignments_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- NGO REGIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS `ngo_regions` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `ngo_user_id` CHAR(36) NOT NULL,
    `city_id` CHAR(36) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `unique_ngo_region` (`ngo_user_id`, `city_id`),
    FOREIGN KEY (`ngo_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON DELETE CASCADE,
    INDEX `idx_ngo_regions_user` (`ngo_user_id`),
    INDEX `idx_ngo_regions_city` (`city_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- COLLECTION EVENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS `collection_events` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `event_type` VARCHAR(50) DEFAULT 'cleanup',
    `city_id` CHAR(36) NULL,
    `latitude` DECIMAL(10, 6) NOT NULL,
    `longitude` DECIMAL(10, 6) NOT NULL,
    `location_name` VARCHAR(255) NULL,
    `event_date` TIMESTAMP NOT NULL,
    `end_date` TIMESTAMP NULL,
    `max_participants` INT DEFAULT 50,
    `status` VARCHAR(50) DEFAULT 'scheduled',
    `required_equipment` JSON,
    `notes` TEXT NULL,
    `created_by` CHAR(36) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    INDEX `idx_events_city` (`city_id`),
    INDEX `idx_events_date` (`event_date`),
    INDEX `idx_events_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- EVENT REGISTRATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS `event_registrations` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `event_id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NULL,
    `organization_id` CHAR(36) NULL,
    `participant_name` VARCHAR(255) NOT NULL,
    `participant_type` VARCHAR(50) NOT NULL,
    `contact_email` VARCHAR(255) NOT NULL,
    `contact_phone` VARCHAR(50) NULL,
    `team_size` INT DEFAULT 1,
    `status` VARCHAR(50) DEFAULT 'pending',
    `notes` TEXT NULL,
    `approved_by` CHAR(36) NULL,
    `approved_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`event_id`) REFERENCES `collection_events`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE SET NULL,
    INDEX `idx_registrations_event` (`event_id`),
    INDEX `idx_registrations_user` (`user_id`),
    INDEX `idx_registrations_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- COLLECTION ROUTES
-- =====================================================

CREATE TABLE IF NOT EXISTS `collection_routes` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `city_id` CHAR(36) NULL,
    `route_type` VARCHAR(50) DEFAULT 'waste',
    `waypoints` JSON NOT NULL,
    `schedule_days` JSON,
    `schedule_time` TIME NULL,
    `estimated_duration_minutes` INT NULL,
    `assigned_team` VARCHAR(255) NULL,
    `status` VARCHAR(50) DEFAULT 'active',
    `created_by` CHAR(36) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON DELETE SET NULL,
    INDEX `idx_routes_city` (`city_id`),
    INDEX `idx_routes_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TEAM WORKERS
-- =====================================================

CREATE TABLE IF NOT EXISTS `team_workers` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `full_name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NULL,
    `phone` VARCHAR(50) NULL,
    `role` VARCHAR(50) DEFAULT 'collector',
    `city_id` CHAR(36) NULL,
    `assigned_route_id` CHAR(36) NULL,
    `latitude` DECIMAL(10, 6) NULL,
    `longitude` DECIMAL(10, 6) NULL,
    `status` VARCHAR(50) DEFAULT 'active',
    `working_days` JSON,
    `schedule_start` TIME NULL,
    `schedule_end` TIME NULL,
    `notes` TEXT NULL,
    `created_by` CHAR(36) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`assigned_route_id`) REFERENCES `collection_routes`(`id`) ON DELETE SET NULL,
    INDEX `idx_workers_city` (`city_id`),
    INDEX `idx_workers_route` (`assigned_route_id`),
    INDEX `idx_workers_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- DISCHARGE SITES
-- =====================================================

CREATE TABLE IF NOT EXISTS `discharge_sites` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `site_type` VARCHAR(50) DEFAULT 'landfill',
    `city_id` CHAR(36) NULL,
    `latitude` DECIMAL(10, 6) NOT NULL,
    `longitude` DECIMAL(10, 6) NOT NULL,
    `address` TEXT NULL,
    `max_capacity_tons` DECIMAL(12, 2) NULL,
    `current_capacity_tons` DECIMAL(12, 2) DEFAULT 0,
    `capacity_percentage` DECIMAL(5, 2) NULL,
    `waste_types_accepted` JSON,
    `operating_days` JSON,
    `opening_time` TIME NULL,
    `closing_time` TIME NULL,
    `contact_name` VARCHAR(255) NULL,
    `phone` VARCHAR(50) NULL,
    `email` VARCHAR(255) NULL,
    `status` VARCHAR(50) DEFAULT 'operational',
    `notes` TEXT NULL,
    `created_by` CHAR(36) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON DELETE SET NULL,
    INDEX `idx_discharge_city` (`city_id`),
    INDEX `idx_discharge_status` (`status`),
    INDEX `idx_discharge_coords` (`latitude`, `longitude`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SORTING CENTERS
-- =====================================================

CREATE TABLE IF NOT EXISTS `sorting_centers` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `center_type` VARCHAR(50) DEFAULT 'recycling',
    `city_id` CHAR(36) NULL,
    `latitude` DECIMAL(10, 6) NOT NULL,
    `longitude` DECIMAL(10, 6) NOT NULL,
    `address` TEXT NULL,
    `daily_capacity_tons` DECIMAL(12, 2) NULL,
    `current_load_tons` DECIMAL(12, 2) DEFAULT 0,
    `materials_processed` JSON,
    `operating_days` JSON,
    `opening_time` TIME NULL,
    `closing_time` TIME NULL,
    `contact_name` VARCHAR(255) NULL,
    `phone` VARCHAR(50) NULL,
    `email` VARCHAR(255) NULL,
    `status` VARCHAR(50) DEFAULT 'operational',
    `notes` TEXT NULL,
    `created_by` CHAR(36) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON DELETE SET NULL,
    INDEX `idx_sorting_city` (`city_id`),
    INDEX `idx_sorting_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- PARTNER COMPANIES
-- =====================================================

CREATE TABLE IF NOT EXISTS `partner_companies` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `company_type` VARCHAR(50) DEFAULT 'waste_collection',
    `city_id` CHAR(36) NULL,
    `latitude` DECIMAL(10, 6) NULL,
    `longitude` DECIMAL(10, 6) NULL,
    `address` TEXT NULL,
    `contact_name` VARCHAR(255) NULL,
    `phone` VARCHAR(50) NULL,
    `email` VARCHAR(255) NULL,
    `services` JSON,
    `contract_start` DATE NULL,
    `contract_end` DATE NULL,
    `status` VARCHAR(50) DEFAULT 'active',
    `notes` TEXT NULL,
    `created_by` CHAR(36) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON DELETE SET NULL,
    INDEX `idx_partners_city` (`city_id`),
    INDEX `idx_partners_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SYSTEM SETTINGS
-- =====================================================

CREATE TABLE IF NOT EXISTS `system_settings` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `key` VARCHAR(255) NOT NULL UNIQUE,
    `value` JSON NOT NULL,
    `category` VARCHAR(100) DEFAULT 'general',
    `description` TEXT NULL,
    `is_public` BOOLEAN DEFAULT FALSE,
    `updated_by` CHAR(36) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_settings_key` (`key`),
    INDEX `idx_settings_category` (`category`),
    INDEX `idx_settings_public` (`is_public`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- USER ACTIVITY LOGS
-- =====================================================

CREATE TABLE IF NOT EXISTS `user_activity_logs` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `user_id` CHAR(36) NOT NULL,
    `action` VARCHAR(100) NOT NULL,
    `entity_type` VARCHAR(100) NULL,
    `entity_id` CHAR(36) NULL,
    `metadata` JSON NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_activity_user` (`user_id`),
    INDEX `idx_activity_action` (`action`),
    INDEX `idx_activity_entity` (`entity_type`, `entity_id`),
    INDEX `idx_activity_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- VIEWS (Public data views)
-- =====================================================

CREATE OR REPLACE VIEW `reports_public` AS
SELECT 
    id,
    category,
    description,
    ROUND(latitude, 3) AS latitude,
    ROUND(longitude, 3) AS longitude,
    city_id,
    status,
    priority,
    photos,
    created_at,
    updated_at,
    verified_at,
    resolved_at,
    sla_due_date,
    is_deleted
FROM reports
WHERE is_deleted = FALSE;

CREATE OR REPLACE VIEW `profiles_public` AS
SELECT 
    id,
    full_name,
    avatar_url,
    city_id,
    impact_score,
    reports_count,
    created_at
FROM profiles
WHERE is_active = TRUE;

CREATE OR REPLACE VIEW `discharge_sites_public` AS
SELECT 
    id,
    name,
    site_type,
    city_id,
    latitude,
    longitude,
    address,
    max_capacity_tons,
    current_capacity_tons,
    capacity_percentage,
    waste_types_accepted,
    operating_days,
    opening_time,
    closing_time,
    status,
    created_at
FROM discharge_sites
WHERE status != 'closed';

CREATE OR REPLACE VIEW `sorting_centers_public` AS
SELECT 
    id,
    name,
    center_type,
    city_id,
    latitude,
    longitude,
    address,
    daily_capacity_tons,
    current_load_tons,
    materials_processed,
    operating_days,
    opening_time,
    closing_time,
    status,
    created_at
FROM sorting_centers
WHERE status != 'closed';

-- =====================================================
-- TRIGGERS
-- =====================================================

DELIMITER //

-- Auto-generate UUID for users
CREATE TRIGGER before_insert_users
BEFORE INSERT ON users
FOR EACH ROW
BEGIN
    IF NEW.id IS NULL OR NEW.id = '' THEN
        SET NEW.id = UUID();
    END IF;
END//

-- Auto-generate UUID and create profile for new users
CREATE TRIGGER after_insert_users
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    INSERT INTO profiles (id, full_name, email)
    VALUES (NEW.id, COALESCE(JSON_UNQUOTE(JSON_EXTRACT(NEW.raw_user_meta_data, '$.full_name')), 'User'), NEW.email);
    
    INSERT INTO user_roles (id, user_id, role)
    VALUES (UUID(), NEW.id, 'citizen');
END//

-- Set SLA due date on report creation
CREATE TRIGGER before_insert_reports
BEFORE INSERT ON reports
FOR EACH ROW
BEGIN
    IF NEW.id IS NULL OR NEW.id = '' THEN
        SET NEW.id = UUID();
    END IF;
    
    IF NEW.sla_due_date IS NULL THEN
        SET NEW.sla_due_date = CASE NEW.priority
            WHEN 'critical' THEN DATE_ADD(NEW.created_at, INTERVAL 24 HOUR)
            WHEN 'high' THEN DATE_ADD(NEW.created_at, INTERVAL 3 DAY)
            WHEN 'medium' THEN DATE_ADD(NEW.created_at, INTERVAL 7 DAY)
            WHEN 'low' THEN DATE_ADD(NEW.created_at, INTERVAL 14 DAY)
            ELSE DATE_ADD(NEW.created_at, INTERVAL 7 DAY)
        END;
    END IF;
END//

-- Log report creation
CREATE TRIGGER after_insert_reports
AFTER INSERT ON reports
FOR EACH ROW
BEGIN
    INSERT INTO report_history (id, report_id, changed_by, action, new_status, new_data)
    VALUES (UUID(), NEW.id, NEW.user_id, 'created', NEW.status, JSON_OBJECT(
        'category', NEW.category,
        'description', NEW.description,
        'priority', NEW.priority
    ));
    
    -- Increment user impact score
    IF NEW.user_id IS NOT NULL THEN
        UPDATE profiles 
        SET impact_score = COALESCE(impact_score, 0) + 10,
            reports_count = COALESCE(reports_count, 0) + 1
        WHERE id = NEW.user_id;
    END IF;
END//

-- Log report status changes
CREATE TRIGGER after_update_reports
AFTER UPDATE ON reports
FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO report_history (id, report_id, changed_by, action, old_status, new_status)
        VALUES (UUID(), NEW.id, NEW.resolved_by, 'status_changed', OLD.status, NEW.status);
    END IF;
END//

DELIMITER ;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- INITIAL DATA (Morocco regions)
-- =====================================================

INSERT INTO cities (id, name, country, region, latitude, longitude, population) VALUES
(UUID(), 'Casablanca', 'Morocco', 'Casablanca-Settat', 33.5731, -7.5898, 3359000),
(UUID(), 'Rabat', 'Morocco', 'Rabat-Salé-Kénitra', 34.0209, -6.8416, 577827),
(UUID(), 'Marrakech', 'Morocco', 'Marrakech-Safi', 31.6295, -7.9811, 928850),
(UUID(), 'Fès', 'Morocco', 'Fès-Meknès', 34.0331, -5.0003, 1112072),
(UUID(), 'Tanger', 'Morocco', 'Tanger-Tétouan-Al Hoceïma', 35.7595, -5.8340, 947952),
(UUID(), 'Agadir', 'Morocco', 'Souss-Massa', 30.4278, -9.5981, 421844),
(UUID(), 'Oujda', 'Morocco', 'Oriental', 34.6867, -1.9114, 494252),
(UUID(), 'Kénitra', 'Morocco', 'Rabat-Salé-Kénitra', 34.2610, -6.5802, 431282),
(UUID(), 'Tétouan', 'Morocco', 'Tanger-Tétouan-Al Hoceïma', 35.5889, -5.3626, 380787),
(UUID(), 'Salé', 'Morocco', 'Rabat-Salé-Kénitra', 34.0531, -6.7985, 890403),
(UUID(), 'Meknès', 'Morocco', 'Fès-Meknès', 33.8935, -5.5473, 632079),
(UUID(), 'Nador', 'Morocco', 'Oriental', 35.1681, -2.9287, 161726);
