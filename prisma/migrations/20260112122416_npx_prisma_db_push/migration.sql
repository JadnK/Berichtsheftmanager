-- CreateTable
CREATE TABLE "Apprentice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WeeklyReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weekNumber" INTEGER,
    "year" INTEGER,
    "title" TEXT,
    "rawContent" TEXT NOT NULL,
    "aiContent" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "reportDate" DATETIME NOT NULL,
    "startDate" DATETIME,
    "manuallyEdited" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "apprenticeId" TEXT NOT NULL,
    CONSTRAINT "WeeklyReport_apprenticeId_fkey" FOREIGN KEY ("apprenticeId") REFERENCES "Apprentice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Apprentice_email_key" ON "Apprentice"("email");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyReport_apprenticeId_reportDate_key" ON "WeeklyReport"("apprenticeId", "reportDate");
