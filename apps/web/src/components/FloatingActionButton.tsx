import { useAppDispatch } from "src/store";
import { setModal } from "src/store/modal";
import { PlusIcon } from "@heroicons/react/20/solid";

export function FloatingActionButton() {
  const dispatch = useAppDispatch();

  const hanldleClick = () => {
    console.log("clicked");
    dispatch(setModal("CreateNewEntryModal"));
  };

  return (
    <button
      type="button"
      onClick={hanldleClick}
      className="fixed bottom-0 right-0 p-3 m-5 rounded-full bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
    >
      <PlusIcon className="h-7 w-7" aria-hidden="true" />
    </button>
  );
}
