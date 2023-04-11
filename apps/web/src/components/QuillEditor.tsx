import axios from "axios";
import { useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.core.css";
import "quill/dist/quill.snow.css";

import { setLoading } from "src/store/loading";
import { encrypt, decrypt } from "src/lib/crypto";
import { toArrayBuffer } from "src/utils/buffer";

export default function QuillEditor({
  user,
  prompt,
  router,
  loading,
  dispatch,
  journal,
}) {
  const isNewEntry = router.pathname === "/new";
  const quillRef: any = useRef(null);
  const journalRef = useRef(journal);

  const changeHandler = () => autosave(quillRef, journalRef, prompt);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!quillRef.current) {
      quillRef.current = new Quill("#editor", {
        modules: {
          toolbar: [
            [{ header: [1, 2, false] }],
            ["bold", "italic", "underline"],
            ["image", "code-block"],
          ],
        },
        placeholder: "Compose an epic...",
        theme: "snow", // or 'bubble'
      });
      console.log(quillRef.current);
      quillRef.current.on("text-change", changeHandler);
      loadSavedData(quillRef, journalRef, prompt);

      dispatch(setLoading({ ...loading, editor: false }));
    }
  }, [user, router]);

  return (
    <div
      id="editor"
      style={{ fontSize: "15px" }}
      className="min-h-[60vh]"
    ></div>
  );
}

async function autosave(quillRef, journalRef, prompt) {
  clearTimeout(quillRef.current.__timeout);
  quillRef.current.__timeout = setTimeout(async function () {
    if (quillRef.current.loading) {
      quillRef.current.loading = false;
      return;
    }

    const { ciphertext, iv } = await encrypt(
      JSON.stringify(quillRef.current.getContents())
    );

    if (journalRef.current) {
      await axios.put(`/api/journal/${journalRef.current.id}`, {
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
          journalRef.current = data;
        });
    }
  }, 1000);
}

async function loadSavedData(quillRef, journalRef, prompt) {
  if (journalRef.current) {
    const journal = journalRef.current;
    const decrypted = await decrypt(journal.ciphertext, journal.iv);

    try {
      var content = JSON.parse(decrypted);
      quillRef.current.setContents(content);
    } catch (err) {
      quillRef.current.setText(decrypted);
    }
    quillRef.current.loading = true;
  }
}
