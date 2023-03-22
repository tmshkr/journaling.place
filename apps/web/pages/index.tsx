import axios from "axios";
import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "src/store";
import { setPrompt, selectPrompt } from "src/store/prompt";
import { JournalPrompt } from "src/components/JournalPrompt";

export default function PromptPage() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    axios.get("/api/prompt").then((res) => {
      dispatch(setPrompt(res.data));
    });
  }, []);

  return <JournalPrompt />;
}
