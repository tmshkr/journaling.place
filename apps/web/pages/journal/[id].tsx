import { useRouter } from "next/router";
import { JournalPrompt } from "src/components/JournalPrompt";

export default function JournalPage() {
  const router = useRouter();
  const journalId = router.query.id;
  return <JournalPrompt isNewEntry={false} journalId={journalId} />;
}
