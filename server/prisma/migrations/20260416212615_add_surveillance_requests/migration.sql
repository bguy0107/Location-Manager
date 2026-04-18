-- CreateEnum
CREATE TYPE "RequestingParty" AS ENUM ('LAW_ENFORCEMENT', 'INTERNAL', 'INSURANCE');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'FULFILLED', 'DENIED');

-- CreateTable
CREATE TABLE "surveillance_requests" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "requestingParty" "RequestingParty" NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "footageStartAt" TIMESTAMP(3) NOT NULL,
    "footageEndAt" TIMESTAMP(3) NOT NULL,
    "cameras" INTEGER[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "surveillance_requests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "surveillance_requests" ADD CONSTRAINT "surveillance_requests_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surveillance_requests" ADD CONSTRAINT "surveillance_requests_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
