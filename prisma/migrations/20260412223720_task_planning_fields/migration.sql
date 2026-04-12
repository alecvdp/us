-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "assignee" TEXT NOT NULL DEFAULT 'SHARED',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "bucket" TEXT NOT NULL DEFAULT 'THIS_WEEK',
    "dueDate" DATETIME,
    "isGrocery" BOOLEAN NOT NULL DEFAULT false,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Task" ("assignee", "completed", "createdAt", "id", "isGrocery", "title", "updatedAt") SELECT "assignee", "completed", "createdAt", "id", "isGrocery", "title", "updatedAt" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
