import { useEffect } from "react";
import { useQuery } from "react-query";
import { selectUser } from "src/store/user";
import { useAppSelector, useAppDispatch } from "src/store";
import { setPrompt, selectPrompt } from "src/store/prompt";

import { JournalList } from "src/components/JournalList";
import { getJournals } from "src/store/journal";

export default function JournalIndex() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const { isLoading, error, data } = useQuery(
    "journal",
    () => user && getJournals()
  );

  useEffect(() => {
    dispatch(setPrompt(null));
  }, []);

  return isLoading ? "Loading..." : <JournalList {...{ journals: data }} />;
}
