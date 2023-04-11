import axios from "axios";
import { useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.core.css";
import "quill/dist/quill.snow.css";

import { setLoading } from "src/store/loading";
import { encrypt, decrypt } from "src/lib/crypto";

export default function QuillEditor({
  user,
  prompt,
  router,
  loading,
  dispatch,
  journal,
}) {
  const quillRef: any = useRef(null);
  const journalId = useRef(null);

  const changeHandler = () => autosave(quillRef, journalId, prompt);

  useEffect(() => {
    if (typeof window === "undefined") return;
    journalId.current = journal?.id;
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
      dispatch(setLoading({ ...loading, editor: false }));
    }

    loadSavedData(quillRef, journal);
    quillRef.current.on("text-change", changeHandler);

    return () => {
      journalId.current = null;
      clearTimeout(quillRef.current.__timeout);
      quillRef.current.off("text-change", changeHandler);
      quillRef.current.setText("");
    };
  }, [user, router]);

  return (
    <div
      id="editor"
      style={{ fontSize: "15px" }}
      className="min-h-[60vh]"
    ></div>
  );
}

async function autosave(quillRef, journalId, prompt) {
  clearTimeout(quillRef.current.__timeout);
  quillRef.current.__timeout = setTimeout(async function () {
    if (quillRef.current.loading) {
      quillRef.current.loading = false;
      return;
    }

    const { ciphertext, iv } = await encrypt(
      JSON.stringify(quillRef.current.getContents())
    );

    if (journalId.current) {
      await axios.put(`/api/journal/${journalId.current}`, {
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
          journalId.current = data.id;
        });
    }
  }, 1000);
}

async function loadSavedData(quillRef, journal) {
  if (journal) {
    const decrypted = await decrypt(journal.ciphertext, journal.iv);
    try {
      quillRef.current.setContents(JSON.parse(decrypted));
    } catch (err) {
      quillRef.current.setText(decrypted);
    }
    quillRef.current.loading = true;
  }
}
