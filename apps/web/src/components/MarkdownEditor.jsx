import axios from "axios";
import { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import EasyMDE from "easymde";
import "easymde/dist/easymde.min.css";

import { journalStore } from "src/lib/localForage";
import { useAppSelector } from "src/store";
import { selectUser } from "src/store/user";
import { encrypt, decrypt } from "src/lib/crypto";
import { toArrayBuffer } from "src/utils/buffer";

export default function MarkdownEditor(props) {
  const easyMDEref = useRef(null);
  const createdAtRef = useRef(null);
  const promptId = props.prompt.id;
  const user = useAppSelector(selectUser);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const changeHandler = () => {
      const self = easyMDEref.current;
      clearTimeout(self.__custom_autosave_timeout);
      self.__custom_autosave_timeout = setTimeout(async function () {
        const value = self.value();
        if (!createdAtRef.current) {
          createdAtRef.current = new Date();
        }

        console.log("saving...");
        if (user) {
          const { ciphertext, iv } = await encrypt(value);
          // Save to IndexedDB
          journalStore.setItem(`${user.id}_${promptId}`, {
            ciphertext,
            iv,
            promptText: props.prompt.text,
            createdAt: createdAtRef.current,
            updatedAt: new Date(),
          });
          // Save to Postgres
          axios.put("/api/journal", {
            promptId: String(promptId),
            ciphertext: Buffer.from(ciphertext),
            iv: Buffer.from(iv),
          });
        } else {
          journalStore.setItem(`null_${promptId}`, {
            plaintext: value,
            promptText: props.prompt.text,
            createdAt: createdAtRef.current,
            updatedAt: new Date(),
          });
        }
      }, 1000);
    };

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

async function loadSavedData(easyMDEref, createdAtRef, user, promptId) {
  easyMDEref.current.value("");
  const localCopy = await journalStore.getItem(
    `${user ? user.id : null}_${promptId}`
  );
  if (user) {
    var dbCopy = await axios
      .get(`/api/journal?promptId=${promptId}`)
      .then(({ data: journal }) => {
        if (!journal) return;
        journal.ciphertext = toArrayBuffer(journal.ciphertext.data);
        journal.iv = new Uint8Array(journal.iv.data);
        journal.updatedAt = new Date(journal.updatedAt);
        journal.createdAt = new Date(journal.createdAt);
        createdAtRef.current = journal.createdAt;
        console.log("/api/journal", journal);
        return journal;
      });
  }

  let savedJournal;
  if (localCopy && dbCopy) {
    savedJournal = localCopy.updatedAt > dbCopy.updatedAt ? localCopy : dbCopy;
  } else {
    savedJournal = localCopy || dbCopy;
  }

  if (!savedJournal) return;
  if (user) {
    const decrypted = await decrypt(savedJournal.ciphertext, savedJournal.iv);
    easyMDEref.current.value(decrypted);
  } else {
    easyMDEref.current.value(savedJournal.plaintext);
  }
}
