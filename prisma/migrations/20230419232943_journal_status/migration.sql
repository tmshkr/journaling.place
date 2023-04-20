-- CreateEnum
CREATE TYPE "JournalStatus" AS ENUM ('ACTIVE', 'TRASHED', 'DELETED');

-- AlterTable
ALTER TABLE "Journal" ADD COLUMN     "status" "JournalStatus" NOT NULL DEFAULT 'ACTIVE',
ALTER COLUMN "ciphertext" DROP NOT NULL,
ALTER COLUMN "iv" DROP NOT NULL;

CREATE FUNCTION prevent_update_on_deleted_record()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'DELETED' THEN
    RAISE EXCEPTION 'Cannot update a deleted record';
  ELSIF NEW.status = 'DELETED' AND OLD.status = 'ACTIVE' THEN
    RAISE EXCEPTION 'Cannot delete an active record';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER deleted_constraint_trigger
BEFORE UPDATE ON "Journal"
FOR EACH ROW
EXECUTE FUNCTION prevent_update_on_deleted_record();