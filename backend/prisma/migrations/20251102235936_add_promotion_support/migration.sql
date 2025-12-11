-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "promotionIds" TEXT DEFAULT '[]',
    "suspicious" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "transactions_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "transactions_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_transactions" ("amount", "cashierId", "createdAt", "id", "managerVerified", "points", "relatedTransactionId", "remark", "targetUserId", "type", "userId") SELECT "amount", "cashierId", "createdAt", "id", "managerVerified", "points", "relatedTransactionId", "remark", "targetUserId", "type", "userId" FROM "transactions";
DROP TABLE "transactions";
ALTER TABLE "new_transactions" RENAME TO "transactions";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
