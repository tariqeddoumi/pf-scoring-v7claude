-- Add OAuth support columns to pf_scoring_users table
ALTER TABLE "pf_scoring_users" ADD COLUMN "oauthProvider" TEXT;
ALTER TABLE "pf_scoring_users" ADD COLUMN "oauthId" TEXT;
ALTER TABLE "pf_scoring_users" ADD COLUMN "avatar" TEXT;
