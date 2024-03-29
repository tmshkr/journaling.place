import { useQuery } from "react-query";
import { JournalList } from "src/components/JournalList";
import { JournalCache } from "src/services/journal";

export default function JournalIndex() {
  const { data } = useQuery<JournalCache>({
    queryKey: "journal",
  });
  if (!data) return null;

  const journals = Object.values(data.journalsById)
    .filter((j) => j.status === "ACTIVE")
    .sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  return <JournalList journals={journals} />;
}

JournalIndex.auth = true;
