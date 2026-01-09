-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'SSJ', 'SSO', 'HOSPITAL');

-- CreateTable
CREATE TABLE "Location" (
    "id" SERIAL NOT NULL,
    "provinceName" TEXT NOT NULL,
    "districtName" TEXT NOT NULL,
    "subDistrict" TEXT,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'HOSPITAL',
    "orgName" TEXT NOT NULL,
    "locationId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeasureLog" (
    "id" SERIAL NOT NULL,
    "measureId" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT false,
    "detail" TEXT,
    "locationId" INTEGER NOT NULL,
    "recordedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeasureLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PheocReport" (
    "id" SERIAL NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "responseLevel" TEXT,
    "pdfUrl" TEXT,
    "locationId" INTEGER NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PheocReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VulnerableData" (
    "id" SERIAL NOT NULL,
    "groupType" TEXT NOT NULL,
    "targetCount" INTEGER NOT NULL DEFAULT 0,
    "recordDate" TIMESTAMP(3) NOT NULL,
    "locationId" INTEGER NOT NULL,

    CONSTRAINT "VulnerableData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryLog" (
    "id" SERIAL NOT NULL,
    "itemName" TEXT NOT NULL,
    "stockCount" INTEGER NOT NULL DEFAULT 0,
    "recordDate" TIMESTAMP(3) NOT NULL,
    "locationId" INTEGER NOT NULL,

    CONSTRAINT "InventoryLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CleanRoomReport" (
    "id" SERIAL NOT NULL,
    "placeType" TEXT NOT NULL,
    "placeCount" INTEGER NOT NULL DEFAULT 0,
    "targetRoomCount" INTEGER NOT NULL DEFAULT 0,
    "passedStandard" INTEGER NOT NULL DEFAULT 0,
    "anamaiStandard" INTEGER NOT NULL DEFAULT 0,
    "serviceUserCount" INTEGER NOT NULL DEFAULT 0,
    "recordDate" TIMESTAMP(3) NOT NULL,
    "locationId" INTEGER NOT NULL,

    CONSTRAINT "CleanRoomReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationLog" (
    "id" SERIAL NOT NULL,
    "activityType" TEXT NOT NULL,
    "targetGroup" TEXT,
    "itemName" TEXT,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "recordDate" TIMESTAMP(3) NOT NULL,
    "locationId" INTEGER NOT NULL,

    CONSTRAINT "OperationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffIncident" (
    "id" SERIAL NOT NULL,
    "staffName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "incidentDetails" TEXT NOT NULL,
    "recordDate" TIMESTAMP(3) NOT NULL,
    "locationId" INTEGER NOT NULL,

    CONSTRAINT "StaffIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActiveCareLog" (
    "id" SERIAL NOT NULL,
    "activity" TEXT NOT NULL,
    "households" INTEGER NOT NULL DEFAULT 0,
    "people" INTEGER NOT NULL DEFAULT 0,
    "riskGroups" INTEGER NOT NULL DEFAULT 0,
    "recordDate" TIMESTAMP(3) NOT NULL,
    "locationId" INTEGER NOT NULL,

    CONSTRAINT "ActiveCareLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocalAdminSupport" (
    "id" SERIAL NOT NULL,
    "orgCount" INTEGER NOT NULL,
    "maskSupport" INTEGER NOT NULL,
    "dustNetSupport" INTEGER NOT NULL,
    "cleanRoomSupport" INTEGER NOT NULL,
    "recordDate" TIMESTAMP(3) NOT NULL,
    "locationId" INTEGER NOT NULL,

    CONSTRAINT "LocalAdminSupport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeasureLog" ADD CONSTRAINT "MeasureLog_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PheocReport" ADD CONSTRAINT "PheocReport_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VulnerableData" ADD CONSTRAINT "VulnerableData_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLog" ADD CONSTRAINT "InventoryLog_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleanRoomReport" ADD CONSTRAINT "CleanRoomReport_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationLog" ADD CONSTRAINT "OperationLog_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffIncident" ADD CONSTRAINT "StaffIncident_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveCareLog" ADD CONSTRAINT "ActiveCareLog_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocalAdminSupport" ADD CONSTRAINT "LocalAdminSupport_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
