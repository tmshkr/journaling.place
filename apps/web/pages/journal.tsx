import { useState, useEffect } from "react";
import { useAppSelector } from "src/store";
import { selectUser } from "src/store/user";
import { journalStore } from "src/lib/localForage";

import { JournalList } from "src/components/JournalList";
import { syncJournals } from "src/utils/syncJournals";

import { index } from "src/lib/flexsearch";

export default function JournalPage() {
  const user = useAppSelector(selectUser);
  const [journals, setJournals] = useState({});

  useEffect(() => {
    handleSync(setJournals, user?.id);
  }, [user]);

  return <JournalList {...{ journals }} />;
}

async function handleSync(setJournals, userId?) {
  if (userId) {
    const journals = await syncJournals(userId);
    setJournals(journals);
  } else {
    const journals = {};
    journalStore
      .iterate(function (value: any, key, iterationNumber) {
        if (key.startsWith("null")) {
          journals[key] = value;
          index.add(key, value.plaintext);
        }
      })
      .then(() => {
        setJournals(journals);
        console.log(index);
      });
  }
}
