import axios from "axios";
import { useEffect, useRef, useState } from "react";
import Quill from "quill";
import QuillMarkdown from "quilljs-markdown";
import "quilljs-markdown/dist/quilljs-markdown-common-style.css";
import "quill/dist/quill.core.css";
import "quill/dist/quill.snow.css";

import { setLoading } from "src/store/loading";
import { encrypt, decrypt } from "src/lib/crypto";

import { OtherEntries } from "./OtherEntries";

export default function QuillEditor(props) {
  const { user, prompt, router, loading, dispatch } = props;
  const [journal, setJournal] = useState(props.journal);
  const quillRef: any = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!quillRef.current) {
      quillRef.current = new Quill("#editor", {
        modules: {
          toolbar: [
            [{ header: [1, 2, false] }],
            ["bold", "italic", "underline"],
            ["code-block"],
          ],
        },
        placeholder: "Compose an epic...",
        theme: "snow", // or 'bubble'
      });
      new QuillMarkdown(quillRef.current);
      dispatch(setLoading({ ...loading, editor: false }));
    }

    quillRef.current.focus();
    const changeHandler = () => autosave(quillRef, journal, prompt, setJournal);
    quillRef.current.on("text-change", changeHandler);

    return () => {
      clearTimeout(quillRef.current.__timeout);
      quillRef.current.off("text-change", changeHandler);
    };
  }, [user, router, journal, prompt]);

  useEffect(() => {
    setJournal(props.journal);
    loadSavedData(quillRef, props.journal);
  }, [router]);

  return (
    <>
      <div
        id="editor"
        data-test="editor"
        style={{ fontSize: "15px" }}
        className="min-h-[60vh]"
      />
      <OtherEntries {...{ journal, prompt }} />
    </>
  );
}

async function autosave(quillRef, journal, prompt, setJournal) {
  clearTimeout(quillRef.current.__timeout);
  quillRef.current.__timeout = setTimeout(async function () {
    const { ciphertext, iv } = await encrypt(
      JSON.stringify(quillRef.current.getContents())
    );

    if (journal?.id) {
      await axios.put(`/api/journal/${journal?.id}`, {
        ciphertext: Buffer.from(ciphertext),
        iv: Buffer.from(iv),
      });
    } else {
      await axios
        .post("/api/journal", {
          promptId: prompt ? String(prompt.id) : undefined,
          ciphertext: Buffer.from(ciphertext),
          iv: Buffer.from(iv),
        })
        .then(({ data }) => {
          setJournal({ id: data.id });
        });
    }
  }, 1000);
}

async function loadSavedData(quillRef, journal) {
  if (journal?.id) {
    const decrypted = await decrypt(journal.ciphertext, journal.iv);
    try {
      quillRef.current.setContents(JSON.parse(decrypted));
    } catch (err) {
      quillRef.current.setText(decrypted);
    }

    clearTimeout(quillRef.current.__timeout);
  }
}
