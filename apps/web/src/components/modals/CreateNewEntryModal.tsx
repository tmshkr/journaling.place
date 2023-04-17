import { useRouter } from "next/router";
import { Dialog, Transition } from "@headlessui/react";
import { useAppDispatch, useAppSelector } from "src/store";
import { setModal, selectModal } from "src/store/modal";
import { currentPrompt } from "src/store/prompt";
import {
  CheckCircleIcon,
  DocumentDuplicateIcon,
  DocumentTextIcon,
  DocumentIcon,
} from "@heroicons/react/20/solid";
import DiceIcon from "@fortawesome/fontawesome-free/svgs/solid/dice.svg";

const buttonClasses =
  "inline-flex mx-1 items-center gap-x-2 rounded-md bg-indigo-600 py-2.5 px-3.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600";

export function CreateNewEntryModal() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const modal = useAppSelector(selectModal);

  return (
    <>
      <div>
        <div className="text-center">
          <Dialog.Title
            as="h3"
            className="text-base font-semibold text-gray-900"
          >
            Create New Entry
          </Dialog.Title>
        </div>
      </div>
      <div className="mt-5 text-center">
        {currentPrompt.value && (
          <button
            type="button"
            onClick={() => {
              router.push(`/${currentPrompt.value?.id}`);
              dispatch(setModal({ ...modal, isVisible: false }));
            }}
            className={buttonClasses}
          >
            <DocumentTextIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
            This Prompt
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            router.push("/random");
            dispatch(setModal({ ...modal, isVisible: false }));
          }}
          className={buttonClasses}
        >
          <DiceIcon className="fill-white -ml-0.5 h-5 w-5" aria-hidden="true" />
          Random Prompt
        </button>
        <button
          type="button"
          onClick={() => {
            router.push("/new");
            dispatch(setModal({ ...modal, isVisible: false }));
          }}
          className={buttonClasses}
        >
          <DocumentIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
          No Prompt
        </button>
      </div>
    </>
  );
}
