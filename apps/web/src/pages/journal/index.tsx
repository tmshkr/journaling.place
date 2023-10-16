import { useQuery } from "react-query";
import { JournalList } from "src/components/JournalList";
import { JournalCache } from "src/store/journal";

export default function JournalIndex() {
  const { data }: { data?: JournalCache } = useQuery({
    queryKey: "journal",
  });
  if (!data) return null;

  const journals = Object.values(data.journalsById)
    .filter((j: any) => j.status === "ACTIVE")
    .sort((a: any, b: any) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  return <JournalList journals={journals} />;
}
