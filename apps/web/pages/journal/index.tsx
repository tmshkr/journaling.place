import { useEffect } from "react";
import { useQuery } from "react-query";
import { selectUser } from "src/store/user";
import { useAppSelector, useAppDispatch } from "src/store";

import { JournalList } from "src/components/JournalList";
import { getJournals } from "src/store/journal";

export default function JournalIndex() {
  const user = useAppSelector(selectUser);
  const { isLoading, error, data } = useQuery(
    "journal",
    () => user && getJournals()
  );

  return isLoading ? "Loading..." : <JournalList {...{ journals: data }} />;
}
