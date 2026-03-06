-- DropForeignKey
ALTER TABLE `family_doctor_requests` DROP FOREIGN KEY `family_doctor_requests_user_subscription_id_fkey`;

-- DropIndex
DROP INDEX `family_doctor_requests_user_subscription_id_key` ON `family_doctor_requests`;

-- AlterTable
ALTER TABLE `family_doctor_requests` ADD COLUMN `billing_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `billing_cycle` ENUM('WEEKLY', 'MONTHLY') NOT NULL DEFAULT 'MONTHLY',
    ADD COLUMN `contract_ends_at` DATETIME(3) NULL,
    ADD COLUMN `contract_starts_at` DATETIME(3) NULL,
    ADD COLUMN `payment_confirmed_at` DATETIME(3) NULL,
    ADD COLUMN `payment_reference` VARCHAR(191) NULL,
    ADD COLUMN `payment_status` ENUM('PENDING_VERIFICATION', 'VERIFIED', 'REJECTED') NOT NULL DEFAULT 'PENDING_VERIFICATION',
    MODIFY `user_subscription_id` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `family_doctor_requests_subscription_idx` ON `family_doctor_requests`(`user_subscription_id`);

-- CreateIndex
CREATE INDEX `family_doctor_requests_patient_doctor_status_idx` ON `family_doctor_requests`(`patient_user_id`, `doctor_profile_id`, `status`);

-- AddForeignKey
ALTER TABLE `family_doctor_requests` ADD CONSTRAINT `family_doctor_requests_user_subscription_id_fkey` FOREIGN KEY (`user_subscription_id`) REFERENCES `user_subscriptions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
