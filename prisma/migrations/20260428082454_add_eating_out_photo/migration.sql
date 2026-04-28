/*
  Warnings:

  - Added the required column `updatedAt` to the `EatingOutLog` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EatingOutLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "mealType" TEXT NOT NULL DEFAULT 'dinner',
    "place" TEXT NOT NULL,
    "cost" REAL NOT NULL DEFAULT 0,
    "photo" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_EatingOutLog" ("cost", "createdAt", "date", "id", "mealType", "note", "place") SELECT "cost", "createdAt", "date", "id", "mealType", "note", "place" FROM "EatingOutLog";
DROP TABLE "EatingOutLog";
ALTER TABLE "new_EatingOutLog" RENAME TO "EatingOutLog";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
