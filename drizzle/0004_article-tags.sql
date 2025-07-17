-- First create a temporary column with the new type
ALTER TABLE "articles" ADD COLUMN "tag_list_new" text[] DEFAULT '{}';

-- Copy data with conversion (this handles existing data safely)
UPDATE "articles" SET "tag_list_new" = 
  CASE 
    WHEN "tag_list" IS NULL THEN '{}'::text[]
    WHEN "tag_list" = '' THEN '{}'::text[]
    ELSE string_to_array("tag_list", ',')
  END;

-- Drop the old column
ALTER TABLE "articles" DROP COLUMN "tag_list";

-- Rename the new column to the original name
ALTER TABLE "articles" RENAME COLUMN "tag_list_new" TO "tag_list";

-- Add any constraints or indexes back if needed
-- ALTER TABLE "articles" ALTER COLUMN "tag_list" SET NOT NULL;
