import { useEffect, useState } from "react";
import axios from "axios";
import Quill from "quill";
import Link from "next/link";

import dayjs from "src/lib/dayjs";
import { decrypt } from "src/lib/crypto";
import { toArrayBuffer } from "src/utils/buffer";

export function OtherEntries({ promptId, journalId }) {
  const [journals, setJournals] = useState<any>([]);
  useEffect(() => {
    if (!promptId) return;

    const quillWorker = new Quill(document.createElement("div"));
    axios.get(`/api/journal?promptId=${promptId}`).then(async ({ data }) => {
      const journals: any = [];
      for (const journal of data) {
        if (journal.id != journalId) {
          journal.ciphertext = toArrayBuffer(journal.ciphertext.data);
          journal.iv = new Uint8Array(journal.iv.data);
          const decrypted = await decrypt(journal.ciphertext, journal.iv);

          try {
            quillWorker.setContents(JSON.parse(decrypted));
            journal.plaintext = quillWorker.getText();
          } catch (err) {
            journal.plaintext = decrypted;
          }

          journals.push(journal);
        }
      }

      setJournals(journals);
    });
  }, [promptId, journalId]);

  if (journals.length === 0) return null;

  return (
    <div className="my-12">
      <h3 className="neuton text-center my-3 text-lg">Looking Back</h3>
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
