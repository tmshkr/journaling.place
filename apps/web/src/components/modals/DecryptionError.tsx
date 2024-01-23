import { Dialog } from "@headlessui/react";
import { cryptoStore, journalStore } from "src/lib/localForage";

const buttonClasses =
  "block m-auto items-center gap-x-2 rounded-md bg-indigo-600 py-2.5 px-3.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600";

export function DecryptionError() {
  const clearLocalData = async () => {
    await cryptoStore.clear();
    await journalStore.clear();
    window.location.reload();
  };

  return (
    <>
      <div>
        <div className="text-center">
          <Dialog.Title
            as="h3"
            className="text-base font-semibold text-gray-900"
          >
            Decryption Error
          </Dialog.Title>
        </div>
      </div>
      <div className="my-5 text-center text-sm text-gray-500">
        <p className="my-2">
          There was an error decrypting your journal. This could be because
          you&apos;ve changed your password, or entered an incorrect password.
        </p>
        <p className="my-2">
          You can try clearing your local data and re-syncing with the server.
        </p>
        <p className="my-2">
          After clearing the local cache, you&apos;ll need to re-enter your
          password.
        </p>
      </div>
      <button type="button" onClick={clearLocalData} className={buttonClasses}>
        Clear Local Data
      </button>
    </>
  );
}
