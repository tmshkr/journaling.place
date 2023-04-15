import Link from "next/link";
import { useQuery } from "react-query";

import dayjs from "src/lib/dayjs";
import { getJournals } from "src/store/journal";

export function OtherEntries({ prompt, journal }) {
  const { data } = useQuery({
    queryKey: "journal",
    queryFn: () => getJournals(),
    staleTime: 5000,
  });

  if (!data) return null;

  const { journalsById } = data;
  const journals: any = [];

  if (prompt.journals) {
    for (const { id } of prompt.journals) {
      if (id === journal.id) continue;
      if (!journalsById[id]) {
        console.error("Journal not found in cache", id);
        continue;
      }
      journals.push(journalsById[id]);
    }
  }

  if (journals.length === 0) return null;

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
