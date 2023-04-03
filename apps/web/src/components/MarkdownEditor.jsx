import axios from "axios";
import { useEffect, useRef } from "react";
import EasyMDE from "easymde";
import "easymde/dist/easymde.min.css";
import { useRouter } from "next/router";

import { selectLoadingState, setLoading } from "src/store/loading";
import { useAppSelector, useAppDispatch } from "src/store";
import { setPrompt, selectPrompt } from "src/store/prompt";
import { selectUser } from "src/store/user";
import { encrypt, decrypt } from "src/lib/crypto";
import { toArrayBuffer } from "src/utils/buffer";

export default function MarkdownEditor() {
  const easyMDEref = useRef(null);
  const user = useAppSelector(selectUser);
  const loading = useAppSelector(selectLoadingState);
  const prompt = useAppSelector(selectPrompt);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const isNewEntry = router.pathname === "/new";
  const journalRef = useRef({
    id: router.pathname === "/journal/[id]" ? router.query.id : null,
  });

  const changeHandler = () => autosave(easyMDEref, journalRef, prompt);

  useEffect(() => {
    console.log("useEffect fired", prompt);
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
        loadSavedData(easyMDEref, journalRef, prompt, dispatch);
      }
      easyMDEref.current.codemirror.on("change", changeHandler);
    }

    return () => {
      console.log("cleanup fired");
      if (user) {
        clearTimeout(easyMDEref.current.__custom_autosave_timeout);
        easyMDEref.current.codemirror.off("change", changeHandler);
      }
    };
  }, [prompt?.id, user]);

  return <textarea id="editor" className="hidden"></textarea>;
}

async function autosave(easyMDEref, journalRef, promptId) {
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

async function loadSavedData(easyMDEref, journalRef, prompt, dispatch) {
  console.log("loading...");
  console.log(journalRef);
  easyMDEref.current.value("");
  if (journalRef.current.id) {
    await axios
      .get(`/api/journal/${journalRef.current.id}`)
      .then(async ({ data: journal }) => {
        console.log(journal);
        journal.ciphertext = toArrayBuffer(journal.ciphertext.data);
        journal.iv = new Uint8Array(journal.iv.data);
        const decrypted = await decrypt(journal.ciphertext, journal.iv);
        easyMDEref.current.value(decrypted);
        journalRef.current.loading = true;
        dispatch(
          setPrompt(
            journal.prompt
              ? { ...journal.prompt, id: journal.prompt.id.toString() }
              : null
          )
        );
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
