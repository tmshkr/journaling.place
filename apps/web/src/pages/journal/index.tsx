import { useQuery } from "react-query";
import { JournalList } from "src/components/JournalList";

export default function JournalIndex() {
  const { data }: { data: any } = useQuery({
    queryKey: "journal",
  });

  return data ? <JournalList journals={data.journalsById} /> : null;
}
