-- CreateTable
CREATE TABLE "routes" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "smId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER,
    "smPayload" JSONB NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "techs" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "nameKey" TEXT NOT NULL,
    "punchesEmployeeId" TEXT,
    "punchesLinkedBy" TEXT,
    "lastSeenOn" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "techs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tech_pay_rates" (
    "id" SERIAL NOT NULL,
    "techId" INTEGER NOT NULL,
    "hourlyRate" DECIMAL(8,2) NOT NULL,
    "effectiveFrom" DATE NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tech_pay_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "punch_employees" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lastPunchAt" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "punch_employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "punch_shifts" (
    "id" SERIAL NOT NULL,
    "punchesEmployeeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "workedHours" DECIMAL(6,2) NOT NULL,
    "incomplete" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "punch_shifts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "routes_companyId_smId_key" ON "routes"("companyId", "smId");

-- CreateIndex
CREATE UNIQUE INDEX "techs_nameKey_key" ON "techs"("nameKey");

-- CreateIndex
CREATE UNIQUE INDEX "techs_punchesEmployeeId_key" ON "techs"("punchesEmployeeId");

-- CreateIndex
CREATE UNIQUE INDEX "tech_pay_rates_techId_effectiveFrom_key" ON "tech_pay_rates"("techId", "effectiveFrom");

-- CreateIndex
CREATE INDEX "punch_shifts_date_idx" ON "punch_shifts"("date");

-- CreateIndex
CREATE UNIQUE INDEX "punch_shifts_punchesEmployeeId_date_key" ON "punch_shifts"("punchesEmployeeId", "date");

-- CreateIndex
CREATE INDEX "appointments_companyId_smOrderId_idx" ON "appointments"("companyId", "smOrderId");

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "techs" ADD CONSTRAINT "techs_punchesEmployeeId_fkey" FOREIGN KEY ("punchesEmployeeId") REFERENCES "punch_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tech_pay_rates" ADD CONSTRAINT "tech_pay_rates_techId_fkey" FOREIGN KEY ("techId") REFERENCES "techs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "punch_shifts" ADD CONSTRAINT "punch_shifts_punchesEmployeeId_fkey" FOREIGN KEY ("punchesEmployeeId") REFERENCES "punch_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

