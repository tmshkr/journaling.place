import { useQuery } from "react-query";
import { JournalList } from "src/components/JournalList";

export default function JournalIndex() {
  const { data }: { data: any } = useQuery({
    queryKey: "journal",
  });
  if (!data) return null;

  const journals = Object.values(data.journalsById)
    .filter((j: any) => j.status === "TRASHED")
    .sort((a: any, b: any) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  return <JournalList journals={journals} />;
}

JournalIndex.auth = true;
