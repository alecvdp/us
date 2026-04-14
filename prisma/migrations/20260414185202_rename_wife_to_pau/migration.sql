-- Rename assignee value WIFE → PAU in all existing task rows
UPDATE "Task" SET "assignee" = 'PAU' WHERE "assignee" = 'WIFE';
