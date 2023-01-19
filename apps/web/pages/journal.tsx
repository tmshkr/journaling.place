import { useEffect } from "react";
import { useQuery, useQueryClient } from "react-query";
import { useAppSelector } from "src/store";
import { selectUser } from "src/store/user";

import { JournalList } from "src/components/JournalList";
import { getJournal } from "src/store/journal";

export default function JournalPage() {
  const user = useAppSelector(selectUser);
  const queryClient = useQueryClient();
  const { isLoading, error, data } = useQuery("journal", () =>
    getJournal(user?.id)
  );

  useEffect(() => {
    queryClient.cancelQueries("journal", { exact: true });
    queryClient.fetchQuery("journal", () => getJournal(user?.id));
  }, [user]);

  return isLoading ? "Loading..." : <JournalList {...{ journals: data }} />;
}
