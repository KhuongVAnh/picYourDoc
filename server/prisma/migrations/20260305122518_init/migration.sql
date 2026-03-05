-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `role` ENUM('patient', 'doctor', 'admin') NOT NULL DEFAULT 'patient',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `doctor_profiles` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `full_name` VARCHAR(191) NOT NULL,
    `specialty` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NOT NULL,
    `consultation_fee` DECIMAL(10, 2) NOT NULL,
    `years_experience` INTEGER NOT NULL,
    `bio` VARCHAR(191) NOT NULL,
    `rating_avg` DOUBLE NOT NULL DEFAULT 0,
    `review_count` INTEGER NOT NULL DEFAULT 0,
    `insurances_accepted` JSON NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `doctor_profiles_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `doctor_slots` (
    `id` VARCHAR(191) NOT NULL,
    `doctor_id` VARCHAR(191) NOT NULL,
    `start_at` DATETIME(3) NOT NULL,
    `end_at` DATETIME(3) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `is_booked` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `doctor_slots_doctor_id_start_at_end_at_key`(`doctor_id`, `start_at`, `end_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `appointments` (
    `id` VARCHAR(191) NOT NULL,
    `patient_user_id` VARCHAR(191) NOT NULL,
    `doctor_id` VARCHAR(191) NOT NULL,
    `source_type` ENUM('SLOT', 'PROPOSAL') NOT NULL,
    `status` ENUM('REQUESTED', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'RESCHEDULED', 'COMPLETED') NOT NULL DEFAULT 'REQUESTED',
    `start_at` DATETIME(3) NOT NULL,
    `end_at` DATETIME(3) NOT NULL,
    `reason` VARCHAR(191) NULL,
    `cancel_reason` VARCHAR(191) NULL,
    `reschedule_reason` VARCHAR(191) NULL,
    `conflict_flag` BOOLEAN NOT NULL DEFAULT false,
    `slot_id` VARCHAR(191) NULL,
    `confirmed_at` DATETIME(3) NULL,
    `cancelled_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `appointments_doctor_status_time_idx`(`doctor_id`, `status`, `start_at`, `end_at`),
    INDEX `appointments_patient_status_time_idx`(`patient_user_id`, `status`, `start_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `in_app_notifications` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `read_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_user_created_idx`(`user_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reminder_logs` (
    `id` VARCHAR(191) NOT NULL,
    `appointment_id` VARCHAR(191) NOT NULL,
    `channel` ENUM('IN_APP', 'EMAIL') NOT NULL,
    `scheduled_for` DATETIME(3) NOT NULL,
    `sent_at` DATETIME(3) NULL,
    `status` ENUM('PENDING', 'SENT', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `error_message` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `reminder_status_schedule_idx`(`status`, `scheduled_for`),
    UNIQUE INDEX `reminder_logs_appointment_id_channel_scheduled_for_key`(`appointment_id`, `channel`, `scheduled_for`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `doctor_profiles` ADD CONSTRAINT `doctor_profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `doctor_slots` ADD CONSTRAINT `doctor_slots_doctor_id_fkey` FOREIGN KEY (`doctor_id`) REFERENCES `doctor_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_patient_user_id_fkey` FOREIGN KEY (`patient_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_doctor_id_fkey` FOREIGN KEY (`doctor_id`) REFERENCES `doctor_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_slot_id_fkey` FOREIGN KEY (`slot_id`) REFERENCES `doctor_slots`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `in_app_notifications` ADD CONSTRAINT `in_app_notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reminder_logs` ADD CONSTRAINT `reminder_logs_appointment_id_fkey` FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
