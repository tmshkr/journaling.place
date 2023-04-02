import axios from "axios";
import { useEffect, useRef } from "react";
import EasyMDE from "easymde";
import "easymde/dist/easymde.min.css";

import { selectLoadingState, setLoading } from "src/store/loading";
import { useAppSelector, useAppDispatch } from "src/store";
import { selectUser } from "src/store/user";
import { encrypt, decrypt } from "src/lib/crypto";
import { toArrayBuffer } from "src/utils/buffer";

export default function MarkdownEditor(props) {
  const easyMDEref = useRef(null);
  const journalRef = useRef({});
  const promptId = props.prompt.id;
  const user = useAppSelector(selectUser);
  const loading = useAppSelector(selectLoadingState);
  const dispatch = useAppDispatch();

  const changeHandler = () => autosave(easyMDEref, journalRef, promptId);

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
      loadSavedData(easyMDEref, journalRef, promptId);
      easyMDEref.current.codemirror.on("change", changeHandler);
    }

    return () => {
      if (user) {
        clearTimeout(easyMDEref.current.__custom_autosave_timeout);
        easyMDEref.current.codemirror.off("change", changeHandler);
      }
    };
  }, [promptId, user]);

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
          promptId: String(promptId),
          ciphertext: Buffer.from(ciphertext),
          iv: Buffer.from(iv),
        })
        .then(({ data: journal }) => {
          journalRef.current.id = journal.id;
        });
    }
  }, 1000);
}

async function loadSavedData(easyMDEref, journalRef, promptId) {
  easyMDEref.current.value("");

  await axios
    .get(`/api/journal?promptId=${promptId}`)
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
