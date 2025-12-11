-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_resetpassword" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "token" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "resetpassword_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_resetpassword" ("expiresAt", "id", "token", "userId") SELECT "expiresAt", "id", "token", "userId" FROM "resetpassword";
DROP TABLE "resetpassword";
ALTER TABLE "new_resetpassword" RENAME TO "resetpassword";
CREATE UNIQUE INDEX "resetpassword_token_key" ON "resetpassword"("token");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
