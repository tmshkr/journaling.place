import { useEffect } from "react";
import { currentPrompt } from "src/store/prompt";
import { JournalView } from "src/components/JournalView";

export default function JournalPage() {
  useEffect(() => {
    currentPrompt.value = null;
    return () => {
      currentPrompt.value = null;
    };
  }, []);
  return <JournalView prompt={null} />;
}
