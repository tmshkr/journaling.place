import axios from "axios";
import { useEffect, useRef } from "react";
import EasyMDE from "easymde";
import "easymde/dist/easymde.min.css";

import { useAppSelector } from "src/store";
import { selectUser } from "src/store/user";
import { encrypt, decrypt } from "src/lib/crypto";
import { toArrayBuffer } from "src/utils/buffer";

export default function MarkdownEditor(props) {
  const easyMDEref = useRef(null);
  const createdAtRef = useRef(null);
  const promptId = props.prompt.id;
  const user = useAppSelector(selectUser);

  const changeHandler = () =>
    autosave(easyMDEref, createdAtRef, user, promptId);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!promptId) return;

    const mdeMounted = document.querySelector(".EasyMDEContainer");
    if (!mdeMounted) {
      easyMDEref.current = new EasyMDE({
        element: document.getElementById("editor"),
      });
    }
    loadSavedData(easyMDEref, createdAtRef, user, promptId);
    easyMDEref.current.codemirror.on("change", changeHandler);

    return () => {
      clearTimeout(easyMDEref.current.__custom_autosave_timeout);
      easyMDEref.current.codemirror.off("change", changeHandler);
    };
  }, [promptId, user]);

  return <textarea id="editor" className="hidden"></textarea>;
}

async function autosave(easyMDEref, createdAtRef, user, promptId) {
  const self = easyMDEref.current;
  clearTimeout(self.__custom_autosave_timeout);
  self.__custom_autosave_timeout = setTimeout(async function () {
    const value = self.value();
    const now = new Date();
    if (!createdAtRef.current) {
      createdAtRef.current = new Date();
    }

    if (user) {
      console.log("saving...");
      const { ciphertext, iv } = await encrypt(value);
      await axios
        .put("/api/journal", {
          promptId: String(promptId),
          ciphertext: Buffer.from(ciphertext),
          iv: Buffer.from(iv),
          updatedAt: now,
        })
        .then(({ data: journal }) => journal.id);
    }
  }, 1000);
}

async function loadSavedData(easyMDEref, createdAtRef, user, promptId) {
  easyMDEref.current.value("");

  if (user) {
    const journal = await axios
      .get(`/api/journal?promptId=${promptId}`)
      .then(({ data: journal }) => {
        if (!journal) return;
        journal.ciphertext = toArrayBuffer(journal.ciphertext.data);
        journal.iv = new Uint8Array(journal.iv.data);
        journal.updatedAt = new Date(journal.updatedAt);
        journal.createdAt = new Date(journal.createdAt);
        createdAtRef.current = journal.createdAt;
        return journal;
      });

    if (journal) {
      const decrypted = await decrypt(journal.ciphertext, journal.iv);
      easyMDEref.current.value(decrypted);
    }
  }
}
