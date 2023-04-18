import Link from "next/link";
import { useQueryClient } from "react-query";

import dayjs from "src/lib/dayjs";

export function OtherEntries({ prompt, journal }) {
  const queryClient = useQueryClient();
  const cache: any = queryClient.getQueryData("journal");
  const { journalsById, journalsByPromptId } = cache;
  let journals: any = [];

  if (journalsByPromptId[prompt?.id]) {
    for (const journalId of journalsByPromptId[prompt.id]) {
      if (journalId != journal?.id) {
        journals.push(journalsById[journalId]);
      }
    }
  }

  if (journals.length === 0) return null;
  journals = journals.sort((a, b) => {
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return (
    <div className="my-12">
      <h3 className="neuton text-center my-3 text-lg">More Responses</h3>
      <ul role="list" className="divide-y divide-gray-200">
        {journals.map((journal) => {
          return (
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
          );
        })}
      </ul>
    </div>
  );
}
