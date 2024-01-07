import { useEffect } from "react";
import { useRouter } from "next/router";
import { useQuery } from "react-query";

import { currentPrompt } from "src/store/prompt";
import { JournalView } from "src/components/JournalView";
import { JournalCache } from "src/store/journal";

export default function JournalPage() {
  const router = useRouter();
  const { data } = useQuery<JournalCache>({
    queryKey: "journal",
  });
  const journal = data?.journalsById[router.query.id as string];

  useEffect(() => {
    if (journal) {
      currentPrompt.value = journal.prompt;
    }
    return () => {
      currentPrompt.value = null;
    };
  }, [journal]);

  return journal ? (
    <JournalView prompt={journal.prompt} journal={journal} />
  ) : null;
}

JournalPage.auth = true;
