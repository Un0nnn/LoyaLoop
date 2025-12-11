/*
  Warnings:

  - You are about to drop the `passwordreset` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "passwordreset";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "resetpassword" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "token" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "resetpassword_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "resetpassword_token_key" ON "resetpassword"("token");
