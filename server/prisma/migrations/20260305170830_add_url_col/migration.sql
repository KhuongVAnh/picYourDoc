-- AlterTable
ALTER TABLE `care_plans` ADD COLUMN `image_urls` JSON NULL;

-- AlterTable
ALTER TABLE `doctor_profiles` ADD COLUMN `avatar_url` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `family_members` ADD COLUMN `avatar_url` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `subscription_plans` ADD COLUMN `thumbnail_url` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `timeline_entries` ADD COLUMN `image_urls` JSON NULL;
