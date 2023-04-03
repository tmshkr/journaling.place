import { useEffect, useState } from "react";
import { currentPrompt } from "src/store/prompt";
import { JournalView } from "src/components/JournalView";

export default function JournalPage() {
  const [prompt, setPrompt] = useState(null);
  useEffect(() => {
    currentPrompt.value = prompt;
    return () => {
      currentPrompt.value = null;
    };
  }, [prompt]);
  return <JournalView prompt={prompt} setPrompt={setPrompt} />;
}
