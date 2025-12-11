/*
  Warnings:

  - You are about to drop the column `pointsRemain` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `published` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `promotionIds` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `suspicious` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `users` table. All the data in the column will be lost.
  - Added the required column `name` to the `users` table without a default value. This is not possible if the table is not empty.

*/
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
INSERT INTO "new_events" ("capacity", "description", "endTime", "id", "location", "name", "pointsAllocated", "pointsAwarded", "startTime") SELECT "capacity", "description", "endTime", "id", "location", "name", "pointsAllocated", "pointsAwarded", "startTime" FROM "events";
DROP TABLE "events";
ALTER TABLE "new_events" RENAME TO "events";
CREATE TABLE "new_transactions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "cashierId" INTEGER,
    "managerVerified" BOOLEAN DEFAULT false,
    "relatedTransactionId" INTEGER,
    "targetUserId" INTEGER,
    "remark" TEXT DEFAULT '',
    CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "transactions_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "transactions_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_transactions" ("amount", "cashierId", "createdAt", "id", "managerVerified", "points", "relatedTransactionId", "remark", "targetUserId", "type", "userId") SELECT "amount", "cashierId", "createdAt", "id", "managerVerified", "points", "relatedTransactionId", "remark", "targetUserId", "type", "userId" FROM "transactions";
DROP TABLE "transactions";
ALTER TABLE "new_transactions" RENAME TO "transactions";
CREATE TABLE "new_users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "utorid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'regular',
    "points" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLogin" DATETIME,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "suspicious" BOOLEAN NOT NULL DEFAULT false,
    "activated" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_users" ("activated", "createdAt", "email", "id", "lastLogin", "password", "points", "role", "suspicious", "utorid", "verified") SELECT "activated", "createdAt", "email", "id", "lastLogin", "password", "points", "role", "suspicious", "utorid", "verified" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_utorid_key" ON "users"("utorid");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
