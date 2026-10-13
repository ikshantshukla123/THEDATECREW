-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('NEVER_MARRIED', 'DIVORCED', 'AWAITING_DIVORCE', 'WIDOWED', 'ANNULLED');

-- CreateEnum
CREATE TYPE "YesNoMaybe" AS ENUM ('YES', 'NO', 'MAYBE');

-- CreateEnum
CREATE TYPE "Diet" AS ENUM ('VEG', 'NON_VEG', 'EGGETARIAN', 'JAIN', 'VEGAN');

-- CreateEnum
CREATE TYPE "Habit" AS ENUM ('NO', 'OCCASIONALLY', 'YES');

-- CreateEnum
CREATE TYPE "FamilyType" AS ENUM ('NUCLEAR', 'JOINT');

-- CreateEnum
CREATE TYPE "FamilyValues" AS ENUM ('TRADITIONAL', 'MODERATE', 'LIBERAL');

-- CreateEnum
CREATE TYPE "Manglik" AS ENUM ('YES', 'NO', 'PARTIAL', 'DONT_KNOW');

-- CreateEnum
CREATE TYPE "EducationLevel" AS ENUM ('DIPLOMA', 'BACHELORS', 'MASTERS', 'DOCTORATE');

-- CreateEnum
CREATE TYPE "ProfileCreatedBy" AS ENUM ('SELF', 'PARENT', 'SIBLING', 'RELATIVE', 'FRIEND');

-- CreateEnum
CREATE TYPE "PipelineStatus" AS ENUM ('NEW', 'VERIFIED', 'SHORTLISTING', 'MATCH_SENT', 'MEETING_SCHEDULED', 'ON_HOLD', 'MATCHED', 'CLOSED');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('SUGGESTED', 'SAVED', 'SKIPPED', 'SENT', 'ACCEPTED', 'DECLINED');

-- CreateEnum
CREATE TYPE "MatchTier" AS ENUM ('HIGH_POTENTIAL', 'GOOD', 'WORTH_EXPLORING', 'LOW');

-- CreateEnum
CREATE TYPE "NoteType" AS ENUM ('CALL', 'MEETING', 'GENERAL');

-- CreateEnum
CREATE TYPE "OutboxStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('STATUS_CHANGED', 'NOTE_ADDED', 'MATCHES_GENERATED', 'MATCH_SENT', 'MATCH_SKIPPED', 'MATCH_SAVED', 'MATCH_STATUS_CHANGED', 'PREFERENCES_UPDATED', 'CONTACT_REVEALED');

-- CreateTable
CREATE TABLE "Matchmaker" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Matchmaker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "photoUrl" TEXT,
    "about" TEXT,
    "profileCreatedBy" "ProfileCreatedBy" NOT NULL DEFAULT 'SELF',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "country" TEXT NOT NULL DEFAULT 'India',
    "state" TEXT,
    "city" TEXT NOT NULL,
    "heightCm" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "undergradCollege" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "highestEducation" "EducationLevel" NOT NULL,
    "annualIncome" INTEGER NOT NULL,
    "company" TEXT,
    "designation" TEXT,
    "maritalStatus" "MaritalStatus" NOT NULL,
    "languages" TEXT[],
    "motherTongue" TEXT NOT NULL,
    "religion" TEXT NOT NULL,
    "caste" TEXT,
    "subCaste" TEXT,
    "gotra" TEXT,
    "manglik" "Manglik" NOT NULL DEFAULT 'DONT_KNOW',
    "brothers" INTEGER NOT NULL DEFAULT 0,
    "sisters" INTEGER NOT NULL DEFAULT 0,
    "familyType" "FamilyType" NOT NULL,
    "familyValues" "FamilyValues" NOT NULL,
    "fatherOccupation" TEXT,
    "motherOccupation" TEXT,
    "diet" "Diet" NOT NULL,
    "smoking" "Habit" NOT NULL DEFAULT 'NO',
    "drinking" "Habit" NOT NULL DEFAULT 'NO',
    "wantKids" "YesNoMaybe" NOT NULL,
    "openToRelocate" "YesNoMaybe" NOT NULL,
    "openToPets" "YesNoMaybe" NOT NULL,
    "isClient" BOOLEAN NOT NULL DEFAULT false,
    "matchmakerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerPreference" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "minAge" INTEGER,
    "maxAge" INTEGER,
    "minHeightCm" INTEGER,
    "maxHeightCm" INTEGER,
    "minIncome" INTEGER,
    "religions" TEXT[],
    "castes" TEXT[],
    "casteNoBar" BOOLEAN NOT NULL DEFAULT true,
    "motherTongues" TEXT[],
    "cities" TEXT[],
    "diets" "Diet"[],
    "acceptDivorced" BOOLEAN NOT NULL DEFAULT false,
    "manglikMatters" BOOLEAN NOT NULL DEFAULT false,
    "weightOverrides" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerPipeline" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "status" "PipelineStatus" NOT NULL DEFAULT 'NEW',
    "lastContactAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerPipeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "ruleScore" INTEGER NOT NULL,
    "ruleBreakdown" JSONB NOT NULL,
    "aiTier" "MatchTier",
    "aiReasons" JSONB,
    "aiConcern" TEXT,
    "aiModel" TEXT,
    "pairHash" TEXT NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'SUGGESTED',
    "introSubject" TEXT,
    "introBody" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailOutbox" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "OutboxStatus" NOT NULL DEFAULT 'QUEUED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailOutbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "type" "NoteType" NOT NULL DEFAULT 'GENERAL',
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "ip" TEXT,
    "success" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Matchmaker_email_key" ON "Matchmaker"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_email_key" ON "Profile"("email");

-- CreateIndex
CREATE INDEX "Profile_gender_isClient_idx" ON "Profile"("gender", "isClient");

-- CreateIndex
CREATE INDEX "Profile_dateOfBirth_idx" ON "Profile"("dateOfBirth");

-- CreateIndex
CREATE INDEX "Profile_religion_idx" ON "Profile"("religion");

-- CreateIndex
CREATE INDEX "Profile_city_idx" ON "Profile"("city");

-- CreateIndex
CREATE INDEX "Profile_matchmakerId_idx" ON "Profile"("matchmakerId");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerPreference_profileId_key" ON "PartnerPreference"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerPipeline_profileId_key" ON "CustomerPipeline"("profileId");

-- CreateIndex
CREATE INDEX "CustomerPipeline_status_idx" ON "CustomerPipeline"("status");

-- CreateIndex
CREATE INDEX "Match_clientId_ruleScore_idx" ON "Match"("clientId", "ruleScore");

-- CreateIndex
CREATE INDEX "Match_status_sentAt_idx" ON "Match"("status", "sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "Match_clientId_candidateId_key" ON "Match"("clientId", "candidateId");

-- CreateIndex
CREATE INDEX "Note_profileId_createdAt_idx" ON "Note"("profileId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_profileId_createdAt_idx" ON "ActivityLog"("profileId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_actorId_createdAt_idx" ON "ActivityLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "LoginAttempt_email_createdAt_idx" ON "LoginAttempt"("email", "createdAt");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_matchmakerId_fkey" FOREIGN KEY ("matchmakerId") REFERENCES "Matchmaker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerPreference" ADD CONSTRAINT "PartnerPreference_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerPipeline" ADD CONSTRAINT "CustomerPipeline_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailOutbox" ADD CONSTRAINT "EmailOutbox_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Matchmaker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Matchmaker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
