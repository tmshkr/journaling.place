import { useQuery } from "react-query";
import { selectUser } from "src/store/user";
import { useAppSelector, useAppDispatch } from "src/store";

import { JournalList } from "src/components/JournalList";
import { getJournals } from "src/store/journal";

export default function JournalIndex() {
  const user = useAppSelector(selectUser);
  const { data } = useQuery({
    queryKey: "journal",
    queryFn: ({ signal }) => {
      if (user) {
        return getJournals();
      } else {
        (signal as any).abort();
      }
    },
    staleTime: 5000,
  });

  return data ? <JournalList journals={data.journalsById} /> : null;
}
