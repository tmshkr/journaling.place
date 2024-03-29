import { useEffect, useRef, useState } from "react";
import Quill from "quill";
import QuillMarkdown from "quilljs-markdown";
import { useQueryClient } from "react-query";
import { CalendarIcon } from "@heroicons/react/20/solid";
import {
  TrashIcon,
  ArchiveBoxIcon,
  ArchiveBoxXMarkIcon,
} from "@heroicons/react/24/outline";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import "quilljs-markdown/dist/quilljs-markdown-common-style.css";
import "quill/dist/quill.core.css";
import "quill/dist/quill.snow.css";

import { setLoading } from "src/store/loading";
import { encrypt, decrypt } from "src/services/crypto";
import dayjs from "src/lib/dayjs";
import { trpc } from "src/services/trpc";

import { setNetworkStatus, NetworkStatus } from "src/store/network";
import { JournalStatus } from "@prisma/client";

import { OtherEntries } from "./OtherEntries";

export default function QuillEditor(props) {
  const queryClient = useQueryClient();
  const { user, prompt, router, loading, dispatch, modal } = props;
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

    if (!modal.isVisible) {
      quillRef.current.focus();
    }
    const changeHandler = () =>
      autosave(quillRef, journal, prompt, setJournal, dispatch);
    quillRef.current.on("text-change", changeHandler);

    return () => {
      clearTimeout(quillRef.current.__timeout);
      quillRef.current.off("text-change", changeHandler);
    };
  }, [user, router, journal, prompt, modal]);

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
      <Tooltip id="tooltip" />
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
            data-tooltip-id="tooltip"
            data-tooltip-html={`Created: ${dayjs(journal.createdAt).format(
              "MMM D h:mm A"
            )}<br/>Updated: ${dayjs(journal.updatedAt).format("MMM D h:mm A")}`}
            data-tooltip-place="bottom"
            data-tooltip-variant="info"
          >
            <CalendarIcon
              className="mr-1.5 w-5 flex-shrink-0 text-gray-400 inline"
              aria-hidden="true"
            />
            <p className="text-sm inline text-gray-500">
              {dayjs(journal.updatedAt).format("MMM D h:mm A")}
            </p>
          </div>
          {journal.status === JournalStatus.TRASHED ? (
            <div className="flex justify-end">
              <button
                className="inline-flex items-center mr-1"
                data-tooltip-id="tooltip"
                data-tooltip-html="Permanently Delete"
                data-tooltip-place="bottom"
                data-tooltip-variant="info"
                onClick={() => {
                  deleteEntry(journal, router, dispatch);
                }}
              >
                <TrashIcon className="w-5 stroke-gray-500" />
              </button>
              <button
                className="inline-flex items-center"
                data-tooltip-id="tooltip"
                data-tooltip-html="Remove from Trash"
                data-tooltip-place="bottom"
                data-tooltip-variant="info"
                onClick={(e) => {
                  removeFromTrash(journal, setJournal, dispatch);
                }}
              >
                <ArchiveBoxIcon className="w-5 stroke-gray-500" />
              </button>
            </div>
          ) : (
            <button
              className="inline-flex items-center"
              data-tooltip-id="tooltip"
              data-tooltip-html="Send to Trash"
              data-tooltip-place="bottom"
              data-tooltip-variant="info"
              onClick={(e) => {
                sendToTrash(journal, setJournal, dispatch);
              }}
            >
              <ArchiveBoxXMarkIcon className="w-5 stroke-gray-500" />
            </button>
          )}
        </div>
      )}

      <OtherEntries {...{ journal, prompt }} />
    </>
  );
}

async function autosave(quillRef, journal, prompt, setJournal, dispatch) {
  clearTimeout(quillRef.current.__timeout);
  quillRef.current.__timeout = setTimeout(async function () {
    const { ciphertext, iv } = await encrypt(
      JSON.stringify(quillRef.current.getContents())
    );

    dispatch(setNetworkStatus(NetworkStatus.pending));
    if (journal?.id) {
      await trpc.journal.updateJournal
        .mutate({
          id: journal.id,
          ciphertext: Buffer.from(ciphertext) as any,
          iv: Buffer.from(iv) as any,
        })
        .then(() => {
          setJournal({ ...journal, updatedAt: new Date() });
        })
        .catch((err) => {
          console.error(err);
          dispatch(setNetworkStatus(NetworkStatus.failed));
        });
    } else {
      await trpc.journal.createJournal
        .mutate({
          promptId: prompt ? String(prompt.id) : undefined,
          ciphertext: Buffer.from(ciphertext) as any,
          iv: Buffer.from(iv) as any,
        })
        .then(({ id }) => {
          const now = new Date();
          setJournal({ id, createdAt: now, updatedAt: now });
        })
        .catch((err) => {
          console.error(err);
          dispatch(setNetworkStatus(NetworkStatus.failed));
        });
    }
    dispatch(setNetworkStatus(NetworkStatus.succeeded));
  }, 1000);
}

async function loadSavedData(quillRef, journal) {
  if (journal?.id) {
    const decrypted = await decrypt(journal.ciphertext, journal.iv).catch(
      (err) => {
        console.error(err);
        return "";
      }
    );
    try {
      quillRef.current.setContents(JSON.parse(decrypted));
    } catch (err) {
      quillRef.current.setText(decrypted);
    }

    clearTimeout(quillRef.current.__timeout);
  }
}

async function sendToTrash(journal, setJournal, dispatch) {
  dispatch(setNetworkStatus(NetworkStatus.pending));
  await trpc.journal.updateJournalStatus.mutate({
    id: journal.id,
    status: JournalStatus.TRASHED,
  });
  dispatch(setNetworkStatus(NetworkStatus.succeeded));
  setJournal({
    ...journal,
    updatedAt: new Date(),
    status: JournalStatus.TRASHED,
  });
}
async function removeFromTrash(journal, setJournal, dispatch) {
  dispatch(setNetworkStatus(NetworkStatus.pending));
  await trpc.journal.updateJournalStatus.mutate({
    id: journal.id,
    status: JournalStatus.ACTIVE,
  });
  dispatch(setNetworkStatus(NetworkStatus.succeeded));
  setJournal({
    ...journal,
    updatedAt: new Date(),
    status: JournalStatus.ACTIVE,
  });
}
async function deleteEntry(journal, router, dispatch) {
  dispatch(setNetworkStatus(NetworkStatus.pending));
  await trpc.journal.updateJournalStatus.mutate({
    id: journal.id,
    status: JournalStatus.DELETED,
  });
  dispatch(setNetworkStatus(NetworkStatus.succeeded));
  router.push("/journal");
}
