import axios from "axios";
import { useEffect, useRef, useState } from "react";
import Quill from "quill";
import QuillMarkdown from "quilljs-markdown";
import { useQueryClient } from "react-query";
import { CalendarIcon } from "@heroicons/react/20/solid";
import { TrashIcon } from "@heroicons/react/24/outline";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import "quilljs-markdown/dist/quilljs-markdown-common-style.css";
import "quill/dist/quill.core.css";
import "quill/dist/quill.snow.css";

import { setLoading } from "src/store/loading";
import { encrypt, decrypt } from "src/lib/crypto";
import dayjs from "src/lib/dayjs";

import { OtherEntries } from "./OtherEntries";

export default function QuillEditor(props) {
  const queryClient = useQueryClient();
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
    quillRef.current.setText("");
    setJournal(props.journal);
    loadSavedData(quillRef, props.journal);
  }, [router]);

  useEffect(() => {
    queryClient.prefetchQuery({ queryKey: "journal", staleTime: 1000 });
  }, [journal]);

  return (
    <>
      <div
        id="editor"
        data-test="editor"
        style={{ fontSize: "15px" }}
        className="min-h-[60vh]"
      />
      {journal && (
        <div className="flex mt-3 justify-between">
          <div
            className="inline-flex items-center w-fit"
            data-tooltip-id="updatedAt-createdAt"
            data-tooltip-html={`Created: ${dayjs(journal.createdAt).format(
              "MMM D h:mm A"
            )}<br/>Updated: ${dayjs(journal.updatedAt).format("MMM D h:mm A")}`}
            data-tooltip-place="bottom"
            data-tooltip-variant="info"
          >
            <Tooltip id="updatedAt-createdAt" />
            <CalendarIcon
              className="mr-1.5 w-5 flex-shrink-0 text-gray-400 inline"
              aria-hidden="true"
            />
            <p className="text-sm inline text-gray-500">
              {dayjs(journal.updatedAt).format("MMM D h:mm A")}
            </p>
          </div>
          <button
            className="inline-flex items-center"
            onClick={() => sendToTrash(journal, setJournal)}
          >
            <TrashIcon className="w-5 stroke-gray-500" />
          </button>
        </div>
      )}

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
      setJournal({ ...journal, updatedAt: new Date() });
    } else {
      await axios
        .post("/api/journal", {
          promptId: prompt ? String(prompt.id) : undefined,
          ciphertext: Buffer.from(ciphertext),
          iv: Buffer.from(iv),
        })
        .then(({ data }) => {
          const now = new Date();
          setJournal({ id: data.id, createdAt: now, updatedAt: now });
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

async function sendToTrash(journal, setJournal) {
  await axios.patch(`/api/journal/${69420 || journal.id}/trash`);
  setJournal({ ...journal, updatedAt: new Date(), status: "TRASHED" });
}
