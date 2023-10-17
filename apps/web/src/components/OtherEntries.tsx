import Link from "next/link";
import { useQueryClient } from "react-query";
import { JournalCache, CachedJournal } from "src/store/journal";

import dayjs from "src/lib/dayjs";

export function OtherEntries({ prompt, journal }) {
  if (!journal && !prompt) return null;
  const queryClient = useQueryClient();
  const cache = queryClient.getQueryData<JournalCache>("journal");
  if (!cache) return null;

  const { journalsById, journalsByPromptId } = cache;
  const relatedJournals: CachedJournal[] = [];

  if (journalsByPromptId[prompt.id]) {
    for (const journalId of journalsByPromptId[prompt.id]) {
      if (journalId !== journal?.id) {
        relatedJournals.push(journalsById[journalId]);
      }
    }
  }

  if (relatedJournals.length === 0) return null;

  return (
    <div className="my-12">
      <h3 className="neuton text-center my-3 text-lg">More Responses</h3>
      <ul role="list" className="divide-y divide-gray-200">
        {relatedJournals
          .sort((a, b) => {
            return (
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );
          })
          .map((journal) => {
            return journal.status === "ACTIVE" ? (
              <li key={journal.id}>
                <Link
                  href={`/journal/${journal.id}`}
                  className="block hover:bg-gray-50"
                >
                  <div className="p-5">
                    <p className="truncate text-sm text-gray-600">
                      {journal.plaintext}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      {dayjs(journal.updatedAt).format("MMM D h:mm A")}
                    </p>
                  </div>
                </Link>
              </li>
            ) : null;
          })}
      </ul>
    </div>
  );
}
