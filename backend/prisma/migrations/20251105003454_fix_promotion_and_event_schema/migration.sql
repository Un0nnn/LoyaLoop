-- AlterTable
ALTER TABLE "transactions" ADD COLUMN "promotionIds" TEXT;

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
    "pointsAwarded" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_events" ("capacity", "description", "endTime", "id", "location", "name", "pointsAllocated", "pointsAwarded", "startTime") SELECT "capacity", "description", "endTime", "id", "location", "name", "pointsAllocated", "pointsAwarded", "startTime" FROM "events";
DROP TABLE "events";
ALTER TABLE "new_events" RENAME TO "events";
CREATE TABLE "new_promotions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "minSpending" REAL,
    "rate" REAL,
    "points" INTEGER
);
INSERT INTO "new_promotions" ("description", "endTime", "id", "minSpending", "name", "points", "rate", "startTime", "type") SELECT "description", "endTime", "id", "minSpending", "name", "points", "rate", "startTime", "type" FROM "promotions";
DROP TABLE "promotions";
ALTER TABLE "new_promotions" RENAME TO "promotions";
CREATE UNIQUE INDEX "promotions_name_key" ON "promotions"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
