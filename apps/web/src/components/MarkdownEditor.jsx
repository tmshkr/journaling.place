import axios from "axios";
import { useEffect, useRef } from "react";
import EasyMDE from "easymde";
import "easymde/dist/easymde.min.css";

import { setLoading } from "src/store/loading";
import { encrypt, decrypt } from "src/lib/crypto";
import { toArrayBuffer } from "src/utils/buffer";

export default function MarkdownEditor({
  user,
  prompt,
  router,
  loading,
  dispatch,
  journal,
}) {
  const isNewEntry = router.pathname === "/new";
  const easyMDEref = useRef(null);
  const journalRef = useRef(journal);

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
        loadSavedData(easyMDEref, journalRef, prompt);
      }
      easyMDEref.current.codemirror.on("change", changeHandler);
    } else {
      easyMDEref.current.value(sampleText);
    }

    return () => {
      if (user) {
        clearTimeout(easyMDEref.current.__custom_autosave_timeout);
        easyMDEref.current.codemirror.off("change", changeHandler);
      }
      easyMDEref.current.value("");
      journalRef.current = null;
    };
  }, [user, router]);

  return <textarea id="editor" className="hidden"></textarea>;
}

async function autosave(easyMDEref, journalRef, prompt) {
  clearTimeout(easyMDEref.current.__custom_autosave_timeout);
  easyMDEref.current.__custom_autosave_timeout = setTimeout(async function () {
    if (easyMDEref.current.loading) {
      easyMDEref.current.loading = false;
      return;
    }

    const { ciphertext, iv } = await encrypt(easyMDEref.current.value());

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

async function loadSavedData(easyMDEref, journalRef, prompt) {
  if (journalRef.current) {
    const journal = journalRef.current;
    const decrypted = await decrypt(journal.ciphertext, journal.iv);
    easyMDEref.current.value(decrypted);
    easyMDEref.current.loading = true;
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
          easyMDEref.current.loading = true;
          journalRef.current = journal;
        }
      });
  }
}

const sampleText = `Want to start keeping a journal but don’t know where to start?

You’re in the right place.

Journaling is a healthy habit, but a blank page can be intimidating.

What do you even write about?

That’s why journaling.place exists.

Get some help on your journaling journey with a growing library of thoughtful and inspiring prompts, or write freestyle with no prompt.

It all gets encrypted on your device, and only **you** hold the key, so nobody else can read your journal.

Sign in now to get started.`;
