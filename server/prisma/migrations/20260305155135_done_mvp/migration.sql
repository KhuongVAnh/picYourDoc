-- AlterTable
ALTER TABLE `consult_sessions` ADD COLUMN `completed_at` DATETIME(3) NULL,
    ADD COLUMN `income_settled_at` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `avatar_url` VARCHAR(191) NULL,
    ADD COLUMN `display_name` VARCHAR(191) NULL,
    ADD COLUMN `phone` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `family_profiles` (
    `id` VARCHAR(191) NOT NULL,
    `owner_user_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `family_profiles_owner_user_id_key`(`owner_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `family_members` (
    `id` VARCHAR(191) NOT NULL,
    `family_profile_id` VARCHAR(191) NOT NULL,
    `full_name` VARCHAR(191) NOT NULL,
    `relation` ENUM('SELF', 'SPOUSE', 'CHILD', 'PARENT', 'SIBLING', 'OTHER') NOT NULL,
    `gender` ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL,
    `date_of_birth` DATETIME(3) NULL,
    `is_primary` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `family_members_family_profile_idx`(`family_profile_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `health_profiles` (
    `id` VARCHAR(191) NOT NULL,
    `member_id` VARCHAR(191) NOT NULL,
    `allergies` JSON NOT NULL,
    `chronic_conditions` JSON NOT NULL,
    `medications` JSON NOT NULL,
    `lifestyle` JSON NOT NULL,
    `blood_type` VARCHAR(191) NULL,
    `emergency_contact` JSON NOT NULL,
    `updated_by_user_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `health_profiles_member_id_key`(`member_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `timeline_entries` (
    `id` VARCHAR(191) NOT NULL,
    `member_id` VARCHAR(191) NOT NULL,
    `appointment_id` VARCHAR(191) NULL,
    `consult_session_id` VARCHAR(191) NULL,
    `doctor_user_id` VARCHAR(191) NULL,
    `entry_type` ENUM('VISIT', 'NOTE', 'PRESCRIPTION', 'LAB_RESULT', 'FOLLOW_UP') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `summary` VARCHAR(191) NOT NULL,
    `payload` JSON NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `timeline_entries_member_created_idx`(`member_id`, `created_at`),
    INDEX `timeline_entries_doctor_created_idx`(`doctor_user_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `care_plans` (
    `id` VARCHAR(191) NOT NULL,
    `member_id` VARCHAR(191) NOT NULL,
    `doctor_id` VARCHAR(191) NOT NULL,
    `frequency_days` INTEGER NOT NULL,
    `next_follow_up_at` DATETIME(3) NULL,
    `medication_plan` JSON NOT NULL,
    `lifestyle_goals` JSON NOT NULL,
    `status` ENUM('ACTIVE', 'PAUSED', 'COMPLETED') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `care_plans_member_status_idx`(`member_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subscription_plans` (
    `id` VARCHAR(191) NOT NULL,
    `code` ENUM('FREE', 'PREMIUM', 'FAMILY') NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `monthly_price` DECIMAL(10, 2) NOT NULL,
    `consult_session_quota` INTEGER NOT NULL,
    `family_member_limit` INTEGER NOT NULL,
    `sla_minutes` INTEGER NULL,
    `is_priority` BOOLEAN NOT NULL DEFAULT false,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `subscription_plans_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_subscriptions` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `plan_id` VARCHAR(191) NOT NULL,
    `status` ENUM('ACTIVE', 'EXPIRED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    `started_at` DATETIME(3) NOT NULL,
    `ends_at` DATETIME(3) NOT NULL,
    `auto_renew` BOOLEAN NOT NULL DEFAULT true,
    `assigned_doctor_profile_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `user_subscriptions_user_status_idx`(`user_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_transactions` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `user_subscription_id` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'VND',
    `payment_method` VARCHAR(191) NOT NULL,
    `mock_result` ENUM('SUCCESS', 'FAILED') NOT NULL,
    `status` ENUM('PENDING', 'SUCCESS', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `failure_reason` VARCHAR(191) NULL,
    `reference_code` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `payment_transactions_reference_code_key`(`reference_code`),
    INDEX `payment_transactions_user_created_idx`(`user_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usage_counter_monthly` (
    `id` VARCHAR(191) NOT NULL,
    `user_subscription_id` VARCHAR(191) NOT NULL,
    `month_key` VARCHAR(191) NOT NULL,
    `consult_sessions_used` INTEGER NOT NULL DEFAULT 0,
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `usage_counter_month_key_idx`(`month_key`),
    UNIQUE INDEX `usage_counter_monthly_user_subscription_id_month_key_key`(`user_subscription_id`, `month_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `doctor_income_ledger` (
    `id` VARCHAR(191) NOT NULL,
    `doctor_user_id` VARCHAR(191) NOT NULL,
    `consult_session_id` VARCHAR(191) NOT NULL,
    `patient_user_id` VARCHAR(191) NOT NULL,
    `plan_code` ENUM('FREE', 'PREMIUM', 'FAMILY') NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'VND',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `doctor_income_ledger_consult_session_id_key`(`consult_session_id`),
    INDEX `doctor_income_ledger_doctor_created_idx`(`doctor_user_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `family_profiles` ADD CONSTRAINT `family_profiles_owner_user_id_fkey` FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `family_members` ADD CONSTRAINT `family_members_family_profile_id_fkey` FOREIGN KEY (`family_profile_id`) REFERENCES `family_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `health_profiles` ADD CONSTRAINT `health_profiles_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `family_members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `health_profiles` ADD CONSTRAINT `health_profiles_updated_by_user_id_fkey` FOREIGN KEY (`updated_by_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `timeline_entries` ADD CONSTRAINT `timeline_entries_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `family_members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `timeline_entries` ADD CONSTRAINT `timeline_entries_appointment_id_fkey` FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `timeline_entries` ADD CONSTRAINT `timeline_entries_consult_session_id_fkey` FOREIGN KEY (`consult_session_id`) REFERENCES `consult_sessions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `timeline_entries` ADD CONSTRAINT `timeline_entries_doctor_user_id_fkey` FOREIGN KEY (`doctor_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `care_plans` ADD CONSTRAINT `care_plans_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `family_members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `care_plans` ADD CONSTRAINT `care_plans_doctor_id_fkey` FOREIGN KEY (`doctor_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_subscriptions` ADD CONSTRAINT `user_subscriptions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_subscriptions` ADD CONSTRAINT `user_subscriptions_plan_id_fkey` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_subscriptions` ADD CONSTRAINT `user_subscriptions_assigned_doctor_profile_id_fkey` FOREIGN KEY (`assigned_doctor_profile_id`) REFERENCES `doctor_profiles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_transactions` ADD CONSTRAINT `payment_transactions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_transactions` ADD CONSTRAINT `payment_transactions_user_subscription_id_fkey` FOREIGN KEY (`user_subscription_id`) REFERENCES `user_subscriptions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usage_counter_monthly` ADD CONSTRAINT `usage_counter_monthly_user_subscription_id_fkey` FOREIGN KEY (`user_subscription_id`) REFERENCES `user_subscriptions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `doctor_income_ledger` ADD CONSTRAINT `doctor_income_ledger_doctor_user_id_fkey` FOREIGN KEY (`doctor_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `doctor_income_ledger` ADD CONSTRAINT `doctor_income_ledger_patient_user_id_fkey` FOREIGN KEY (`patient_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `doctor_income_ledger` ADD CONSTRAINT `doctor_income_ledger_consult_session_id_fkey` FOREIGN KEY (`consult_session_id`) REFERENCES `consult_sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
