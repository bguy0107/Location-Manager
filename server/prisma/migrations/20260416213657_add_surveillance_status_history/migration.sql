-- CreateTable
CREATE TABLE "surveillance_status_history" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "changedById" TEXT NOT NULL,
    "fromStatus" "RequestStatus" NOT NULL,
    "toStatus" "RequestStatus" NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "surveillance_status_history_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "surveillance_status_history" ADD CONSTRAINT "surveillance_status_history_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "surveillance_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surveillance_status_history" ADD CONSTRAINT "surveillance_status_history_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
