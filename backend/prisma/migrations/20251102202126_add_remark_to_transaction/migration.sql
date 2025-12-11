/*
  Warnings:

  - You are about to drop the column `pointsPerAttendee` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `minSpend` on the `promotions` table. All the data in the column will be lost.
  - You are about to drop the column `multiplier` on the `promotions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "transactions" ADD COLUMN "remark" TEXT DEFAULT '';

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_events" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "capacity" INTEGER,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "pointsAllocated" INTEGER NOT NULL DEFAULT 0,
    "pointsAwarded" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_events" ("capacity", "description", "endTime", "id", "location", "name", "startTime") SELECT "capacity", "description", "endTime", "id", "location", "name", "startTime" FROM "events";
DROP TABLE "events";
ALTER TABLE "new_events" RENAME TO "events";
CREATE TABLE "new_promotions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "minSpending" REAL DEFAULT 0,
    "rate" REAL DEFAULT 0,
    "points" INTEGER DEFAULT 0
);
INSERT INTO "new_promotions" ("description", "endTime", "id", "name", "startTime", "type") SELECT "description", "endTime", "id", "name", "startTime", "type" FROM "promotions";
DROP TABLE "promotions";
ALTER TABLE "new_promotions" RENAME TO "promotions";
CREATE UNIQUE INDEX "promotions_name_key" ON "promotions"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
