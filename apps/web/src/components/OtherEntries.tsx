import { useEffect, useState } from "react";
import axios from "axios";
import Quill from "quill";
import Link from "next/link";

import dayjs from "src/lib/dayjs";
import { decrypt } from "src/lib/crypto";
import { toArrayBuffer } from "src/utils/buffer";

export function OtherEntries({ prompt, journal }) {
  const [journals, setJournals] = useState<any>([]);
  useEffect(() => {
    if (!prompt?.id) return;

    const quillWorker = new Quill(document.createElement("div"));
    axios.get(`/api/journal?promptId=${prompt.id}`).then(async ({ data }) => {
      const journals: any = [];
      for (const entry of data) {
        if (entry.id != journal?.id) {
          entry.ciphertext = toArrayBuffer(entry.ciphertext.data);
          entry.iv = new Uint8Array(entry.iv.data);
          const decrypted = await decrypt(entry.ciphertext, entry.iv);

          try {
            quillWorker.setContents(JSON.parse(decrypted));
            entry.plaintext = quillWorker.getText();
          } catch (err) {
            entry.plaintext = decrypted;
          }

          journals.push(entry);
        }
      }

      setJournals(journals);
    });
  }, [prompt, journal]);

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
