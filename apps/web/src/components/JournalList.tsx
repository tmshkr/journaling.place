import dayjs from "src/lib/dayjs";
import Link from "next/link";
import { CalendarIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { FloatingActionButton } from "./FloatingActionButton";

export function JournalList({ journals }) {
  if (!journals) return null;
  return (
    <div className="overflow-hidden bg-white shadow sm:rounded-md">
      <ul role="list" className="divide-y divide-gray-200">
        {journals.map((journal) => {
          return (
            <li key={journal.id}>
              <Link
                href={`/journal/${journal.id}`}
                data-test="JournalList-entry"
                className="block hover:bg-gray-50"
              >
                <div className="flex items-center px-4 py-4 sm:px-6">
                  <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                    <div className="truncate">
                      <div className="text-sm">
                        <h3 className="truncate font-medium text-indigo-600">
                          {journal.prompt?.text}
                        </h3>
                        <p className="truncate font-medium text-gray-600">
                          {journal.plaintext || journal.decrypted}
                        </p>
                      </div>
                      <div className="mt-2 flex">
                        <div className="flex items-center text-sm text-gray-500">
                          <CalendarIcon
                            className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400"
                            aria-hidden="true"
                          />
                          <p>
                            <time dateTime={journal.updatedAt}>
                              {dayjs(journal.updatedAt).format("MMM D h:mm A")}
                            </time>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="ml-5 flex-shrink-0">
                    <ChevronRightIcon
                      className="h-5 w-5 text-gray-400"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
      <FloatingActionButton />
    </div>
  );
}
