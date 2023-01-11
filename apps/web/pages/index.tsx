import axios from "axios";
import { useState, useEffect } from "react";
import { JournalPrompt } from "src/components/JournalPrompt";

export default function PromptPage() {
  const [prompt, setPrompt] = useState(null);

  useEffect(() => {
    axios.get("/api/prompt").then((res) => {
      res.data.text = res.data.prompt;
      setPrompt(res.data);
    });
  }, []);

  return <JournalPrompt prompt={prompt} />;
}
