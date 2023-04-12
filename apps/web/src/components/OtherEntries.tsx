import { useEffect, useState } from "react";
import axios from "axios";

import { decrypt } from "src/lib/crypto";
import { toArrayBuffer } from "src/utils/buffer";

export function OtherEntries({ promptId }) {
  const [journals, setJournals] = useState<any>([]);
  useEffect(() => {
    axios
      .get(`/api/journal?promptId=${promptId}`)
      .then(async ({ data: journals }) => {
        for (const journal of journals) {
          journal.ciphertext = toArrayBuffer(journal.ciphertext.data);
          journal.iv = new Uint8Array(journal.iv.data);
          const decrypted = await decrypt(journal.ciphertext, journal.iv);
          journal.plaintext = decrypted;
        }
        setJournals(journals);
      });
  }, [promptId]);

  if (journals.length === 0) return null;

  return (
    <div className="my-12">
      <h3 className="text-center">Previous Responses</h3>
      <ul role="list" className="divide-y divide-gray-200">
        {journals.map((journal) => {
          return (
            <li key={journal.id} className="py-4">
              <div className="flex space-x-3">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">promptText</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(journal.createdAt).toString()}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500">{journal.plaintext}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
