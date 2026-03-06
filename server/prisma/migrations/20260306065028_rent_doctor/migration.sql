-- AlterTable
ALTER TABLE `appointments` ADD COLUMN `service_type` ENUM('FAMILY_DOCTOR', 'ONE_TIME') NOT NULL DEFAULT 'ONE_TIME';

-- AlterTable
ALTER TABLE `doctor_income_ledger` MODIFY `plan_code` ENUM('FREE', 'PREMIUM', 'FAMILY', 'FAMILY_DOCTOR_WEEKLY', 'FAMILY_DOCTOR_MONTHLY') NOT NULL;

-- AlterTable
ALTER TABLE `doctor_profiles` ADD COLUMN `active_family_count` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `intake_status` ENUM('OPEN', 'PAUSED') NOT NULL DEFAULT 'OPEN',
    ADD COLUMN `max_family_slots` INTEGER NOT NULL DEFAULT 30;

-- AlterTable
ALTER TABLE `subscription_plans` MODIFY `code` ENUM('FREE', 'PREMIUM', 'FAMILY', 'FAMILY_DOCTOR_WEEKLY', 'FAMILY_DOCTOR_MONTHLY') NOT NULL;

-- AlterTable
ALTER TABLE `timeline_entries` ADD COLUMN `diagnosis` VARCHAR(191) NULL,
    ADD COLUMN `service_type` ENUM('FAMILY_DOCTOR', 'ONE_TIME') NULL,
    ADD COLUMN `source_type` ENUM('PATIENT_MANUAL', 'PATIENT_UPLOAD', 'DOCTOR_NOTE', 'SYSTEM_EVENT') NOT NULL DEFAULT 'PATIENT_MANUAL',
    ADD COLUMN `specialty_code` VARCHAR(191) NULL,
    ADD COLUMN `visibility` VARCHAR(191) NOT NULL DEFAULT 'PRIVATE_TO_PATIENT_AND_FAMILY_DOCTOR';

-- CreateTable
CREATE TABLE `timeline_attachments` (
    `id` VARCHAR(191) NOT NULL,
    `timeline_entry_id` VARCHAR(191) NOT NULL,
    `file_name` VARCHAR(191) NOT NULL,
    `file_url` VARCHAR(191) NOT NULL,
    `mime_type` VARCHAR(191) NOT NULL,
    `file_size_bytes` INTEGER NOT NULL,
    `kind` ENUM('LAB_RESULT', 'PRESCRIPTION', 'DIAGNOSIS', 'PDF', 'IMAGE', 'OTHER') NOT NULL,
    `provider` VARCHAR(191) NOT NULL DEFAULT 'cloudinary',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `timeline_attachments_entry_created_idx`(`timeline_entry_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `record_tags` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('SPECIALTY', 'DISEASE', 'CUSTOM') NOT NULL,
    `code` VARCHAR(191) NULL,
    `label` VARCHAR(191) NOT NULL,
    `created_by_user_id` VARCHAR(191) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `record_tags_type_label_idx`(`type`, `label`),
    UNIQUE INDEX `record_tags_type_code_key`(`type`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `timeline_entry_tags` (
    `id` VARCHAR(191) NOT NULL,
    `timeline_entry_id` VARCHAR(191) NOT NULL,
    `tag_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `timeline_entry_tags_tag_created_idx`(`tag_id`, `created_at`),
    UNIQUE INDEX `timeline_entry_tags_timeline_entry_id_tag_id_key`(`timeline_entry_id`, `tag_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `appointment_record_links` (
    `id` VARCHAR(191) NOT NULL,
    `appointment_id` VARCHAR(191) NOT NULL,
    `timeline_entry_id` VARCHAR(191) NOT NULL,
    `scope` ENUM('TEMPORARY', 'CONSULT_ONLY') NOT NULL DEFAULT 'TEMPORARY',
    `expires_at` DATETIME(3) NULL,
    `created_by_user_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `appointment_record_links_appt_created_idx`(`appointment_id`, `created_at`),
    UNIQUE INDEX `appointment_record_links_appointment_id_timeline_entry_id_key`(`appointment_id`, `timeline_entry_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `family_doctor_requests` (
    `id` VARCHAR(191) NOT NULL,
    `patient_user_id` VARCHAR(191) NOT NULL,
    `doctor_profile_id` VARCHAR(191) NOT NULL,
    `doctor_user_id` VARCHAR(191) NOT NULL,
    `user_subscription_id` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `request_note` VARCHAR(191) NULL,
    `response_note` VARCHAR(191) NULL,
    `requested_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `responded_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `family_doctor_requests_doctor_status_idx`(`doctor_profile_id`, `status`, `requested_at`),
    INDEX `family_doctor_requests_patient_status_idx`(`patient_user_id`, `status`, `requested_at`),
    UNIQUE INDEX `family_doctor_requests_user_subscription_id_key`(`user_subscription_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `timeline_attachments` ADD CONSTRAINT `timeline_attachments_timeline_entry_id_fkey` FOREIGN KEY (`timeline_entry_id`) REFERENCES `timeline_entries`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `record_tags` ADD CONSTRAINT `record_tags_created_by_user_id_fkey` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `timeline_entry_tags` ADD CONSTRAINT `timeline_entry_tags_timeline_entry_id_fkey` FOREIGN KEY (`timeline_entry_id`) REFERENCES `timeline_entries`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `timeline_entry_tags` ADD CONSTRAINT `timeline_entry_tags_tag_id_fkey` FOREIGN KEY (`tag_id`) REFERENCES `record_tags`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointment_record_links` ADD CONSTRAINT `appointment_record_links_appointment_id_fkey` FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointment_record_links` ADD CONSTRAINT `appointment_record_links_timeline_entry_id_fkey` FOREIGN KEY (`timeline_entry_id`) REFERENCES `timeline_entries`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointment_record_links` ADD CONSTRAINT `appointment_record_links_created_by_user_id_fkey` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `family_doctor_requests` ADD CONSTRAINT `family_doctor_requests_patient_user_id_fkey` FOREIGN KEY (`patient_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `family_doctor_requests` ADD CONSTRAINT `family_doctor_requests_doctor_profile_id_fkey` FOREIGN KEY (`doctor_profile_id`) REFERENCES `doctor_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `family_doctor_requests` ADD CONSTRAINT `family_doctor_requests_doctor_user_id_fkey` FOREIGN KEY (`doctor_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `family_doctor_requests` ADD CONSTRAINT `family_doctor_requests_user_subscription_id_fkey` FOREIGN KEY (`user_subscription_id`) REFERENCES `user_subscriptions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
