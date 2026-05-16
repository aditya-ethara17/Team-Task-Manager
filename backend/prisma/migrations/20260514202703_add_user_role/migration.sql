-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('MEMBER', 'SUPER_ADMIN');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'MEMBER';
