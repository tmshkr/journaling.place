import axios from "axios";
import { useEffect, useRef } from "react";
import EasyMDE from "easymde";
import "easymde/dist/easymde.min.css";

import { setLoading } from "src/store/loading";
import { setPrompt } from "src/store/prompt";
import { encrypt, decrypt } from "src/lib/crypto";
import { toArrayBuffer } from "src/utils/buffer";

export default function MarkdownEditor({
  user,
  prompt,
  setPrompt,
  router,
  loading,
  dispatch,
}) {
  const isNewEntry = router.pathname === "/new";
  const easyMDEref = useRef(null);
  const journalRef = useRef({
    id: router.pathname === "/journal/[id]" ? router.query.id : null,
  });

  console.log("journalRef", journalRef);
  const changeHandler = () => autosave(easyMDEref, journalRef, prompt);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mdeMounted = document.querySelector(".EasyMDEContainer");
    if (!mdeMounted) {
      easyMDEref.current = new EasyMDE({
        element: document.getElementById("editor"),
      });
      dispatch(setLoading({ ...loading, editor: false }));
    }

    if (user) {
      if (!isNewEntry) {
        loadSavedData(easyMDEref, journalRef, prompt, setPrompt);
      }
      easyMDEref.current.codemirror.on("change", changeHandler);
    }

    return () => {
      if (user) {
        clearTimeout(easyMDEref.current.__custom_autosave_timeout);
        easyMDEref.current.codemirror.off("change", changeHandler);
      }
    };
  }, [user]);

  return <textarea id="editor" className="hidden"></textarea>;
}

async function autosave(easyMDEref, journalRef, prompt) {
  clearTimeout(easyMDEref.current.__custom_autosave_timeout);
  easyMDEref.current.__custom_autosave_timeout = setTimeout(async function () {
    if (journalRef.current.loading) {
      journalRef.current.loading = false;
      return;
    }

    const { ciphertext, iv } = await encrypt(easyMDEref.current.value());

    if (journalRef.current.id) {
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
        .then(({ data: journal }) => {
          journalRef.current.id = journal.id;
        });
    }
  }, 1000);
}

async function loadSavedData(easyMDEref, journalRef, prompt, setPrompt) {
  if (journalRef.current.id) {
    await axios
      .get(`/api/journal/${journalRef.current.id}`)
      .then(async ({ data: journal }) => {
        journal.ciphertext = toArrayBuffer(journal.ciphertext.data);
        journal.iv = new Uint8Array(journal.iv.data);
        const decrypted = await decrypt(journal.ciphertext, journal.iv);
        easyMDEref.current.value(decrypted);
        journalRef.current.loading = true;
        if (journal.prompt) {
          setPrompt(journal.prompt);
        }
      });
  } else if (prompt) {
    await axios
      .get(`/api/journal?promptId=${prompt.id}`)
      .then(async ({ data: journals }) => {
        const [journal] = journals;
        if (journal) {
          journal.ciphertext = toArrayBuffer(journal.ciphertext.data);
          journal.iv = new Uint8Array(journal.iv.data);
          const decrypted = await decrypt(journal.ciphertext, journal.iv);
          easyMDEref.current.value(decrypted);
          journalRef.current.id = journal.id;
          journalRef.current.loading = true;
        }
      });
  }
}
