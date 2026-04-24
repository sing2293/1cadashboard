-- CreateTable
CREATE TABLE "companies" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "smCompanyId" TEXT NOT NULL,
    "tokenEnvVar" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_state" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "resource" TEXT NOT NULL,
    "lastCursor" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sync_state_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_runs" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "resource" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "recordsSeen" INTEGER NOT NULL DEFAULT 0,
    "recordsUpserted" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,

    CONSTRAINT "sync_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "smId" TEXT NOT NULL,
    "accountName" TEXT,
    "accountType" TEXT,
    "isCommercial" BOOLEAN NOT NULL DEFAULT false,
    "email" TEXT,
    "phone" TEXT,
    "leadSource" TEXT,
    "balance" DECIMAL(12,2),
    "smCreatedAt" TIMESTAMP(3),
    "smModifiedAt" TIMESTAMP(3),
    "smPayload" JSONB NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "smId" TEXT NOT NULL,
    "source" TEXT,
    "status" TEXT,
    "assignedTo" TEXT,
    "estimatedValue" DECIMAL(12,2),
    "smCreatedAt" TIMESTAMP(3),
    "smModifiedAt" TIMESTAMP(3),
    "smPayload" JSONB NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "smId" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "role" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "smPayload" JSONB NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "smId" TEXT NOT NULL,
    "accountId" INTEGER,
    "smAccountId" TEXT NOT NULL,
    "orderNumber" TEXT,
    "orderType" TEXT NOT NULL,
    "orderGroup" TEXT,
    "status" TEXT,
    "subtotal" DECIMAL(12,2),
    "grandTotal" DECIMAL(12,2),
    "amountPaid" DECIMAL(12,2),
    "leadSource" TEXT,
    "salesRepSmId" TEXT,
    "completedAt" TIMESTAMP(3),
    "smCreatedAt" TIMESTAMP(3),
    "smModifiedAt" TIMESTAMP(3),
    "smPayload" JSONB NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "smId" TEXT,
    "itemType" TEXT,
    "name" TEXT NOT NULL,
    "normalizedServiceId" INTEGER,
    "quantity" DECIMAL(10,2),
    "unitPrice" DECIMAL(12,2),
    "lineTotal" DECIMAL(12,2),
    "smPayload" JSONB NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_catalog" (
    "id" SERIAL NOT NULL,
    "canonicalName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "service_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_aliases" (
    "id" SERIAL NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "aliasName" TEXT NOT NULL,
    "companyId" INTEGER,

    CONSTRAINT "service_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "smId" TEXT NOT NULL,
    "orderId" INTEGER,
    "smOrderId" TEXT NOT NULL,
    "appointmentType" TEXT,
    "status" TEXT,
    "scheduledStart" TIMESTAMP(3),
    "scheduledEnd" TIMESTAMP(3),
    "actualStart" TIMESTAMP(3),
    "actualEnd" TIMESTAMP(3),
    "estimatedHours" DECIMAL(6,2),
    "actualHours" DECIMAL(6,2),
    "smCreatedAt" TIMESTAMP(3),
    "smModifiedAt" TIMESTAMP(3),
    "smPayload" JSONB NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment_techs" (
    "id" SERIAL NOT NULL,
    "appointmentId" INTEGER NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "timeLogHours" DECIMAL(6,2),

    CONSTRAINT "appointment_techs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "smId" TEXT NOT NULL,
    "orderId" INTEGER,
    "smOrderId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "method" TEXT,
    "paidAt" TIMESTAMP(3),
    "smPayload" JSONB NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "smId" TEXT NOT NULL,
    "accountId" INTEGER,
    "smAccountId" TEXT,
    "activityType" TEXT,
    "subject" TEXT,
    "result" TEXT,
    "occurredAt" TIMESTAMP(3),
    "smPayload" JSONB NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_name_key" ON "companies"("name");

-- CreateIndex
CREATE UNIQUE INDEX "companies_slug_key" ON "companies"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "sync_state_companyId_resource_key" ON "sync_state"("companyId", "resource");

-- CreateIndex
CREATE INDEX "sync_runs_companyId_resource_startedAt_idx" ON "sync_runs"("companyId", "resource", "startedAt");

-- CreateIndex
CREATE INDEX "accounts_companyId_accountType_idx" ON "accounts"("companyId", "accountType");

-- CreateIndex
CREATE INDEX "accounts_companyId_smModifiedAt_idx" ON "accounts"("companyId", "smModifiedAt");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_companyId_smId_key" ON "accounts"("companyId", "smId");

-- CreateIndex
CREATE INDEX "leads_companyId_status_idx" ON "leads"("companyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "leads_companyId_smId_key" ON "leads"("companyId", "smId");

-- CreateIndex
CREATE UNIQUE INDEX "employees_companyId_smId_key" ON "employees"("companyId", "smId");

-- CreateIndex
CREATE INDEX "orders_companyId_orderType_completedAt_idx" ON "orders"("companyId", "orderType", "completedAt");

-- CreateIndex
CREATE INDEX "orders_companyId_smModifiedAt_idx" ON "orders"("companyId", "smModifiedAt");

-- CreateIndex
CREATE UNIQUE INDEX "orders_companyId_smId_key" ON "orders"("companyId", "smId");

-- CreateIndex
CREATE INDEX "order_items_companyId_name_idx" ON "order_items"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "service_catalog_canonicalName_key" ON "service_catalog"("canonicalName");

-- CreateIndex
CREATE UNIQUE INDEX "service_aliases_aliasName_companyId_key" ON "service_aliases"("aliasName", "companyId");

-- CreateIndex
CREATE INDEX "appointments_companyId_scheduledStart_idx" ON "appointments"("companyId", "scheduledStart");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_companyId_smId_key" ON "appointments"("companyId", "smId");

-- CreateIndex
CREATE UNIQUE INDEX "appointment_techs_appointmentId_employeeId_key" ON "appointment_techs"("appointmentId", "employeeId");

-- CreateIndex
CREATE INDEX "payments_companyId_paidAt_idx" ON "payments"("companyId", "paidAt");

-- CreateIndex
CREATE UNIQUE INDEX "payments_companyId_smId_key" ON "payments"("companyId", "smId");

-- CreateIndex
CREATE INDEX "activities_companyId_activityType_occurredAt_idx" ON "activities"("companyId", "activityType", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "activities_companyId_smId_key" ON "activities"("companyId", "smId");

-- AddForeignKey
ALTER TABLE "sync_state" ADD CONSTRAINT "sync_state_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_runs" ADD CONSTRAINT "sync_runs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_normalizedServiceId_fkey" FOREIGN KEY ("normalizedServiceId") REFERENCES "service_catalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_aliases" ADD CONSTRAINT "service_aliases_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "service_catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_techs" ADD CONSTRAINT "appointment_techs_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_techs" ADD CONSTRAINT "appointment_techs_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
