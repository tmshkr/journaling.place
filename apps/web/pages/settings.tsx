import axios from "axios";
import { useState } from "react";
import { useAppSelector } from "src/store";
import { selectUser } from "src/store/user";
import { CheckCircleIcon } from "@heroicons/react/20/solid";
import { cryptoStore, journalStore } from "src/lib/localForage";
import { useForm } from "react-hook-form";
import { clsx } from "clsx";

import { syncJournals } from "src/utils/syncJournals";
import {
  decrypt,
  encrypt,
  testPassword,
  createNewKeyFromPassword,
  setKey,
} from "src/lib/crypto";

export default function SettingsPage() {
  const user = useAppSelector(selectUser);
  const [status, setStatus] = useState("idle");
  const { register, handleSubmit, formState, setError, setFocus, setValue } =
    useForm();
  const { errors }: { errors: any } = formState;

  if (!user) return null;

  const onSubmit = async (values) => {
    const { current_password, new_password, confirm_new_password } = values;
    if (new_password !== confirm_new_password) {
      setError("confirm_new_password", {
        message: "Passwords do not match.",
      });
      setFocus("confirm_new_password");
      return;
    }

    // test current password
    const isCurrentPassword = await testPassword(user.id, current_password);
    if (!isCurrentPassword) {
      setError("current_password", {
        message: "Current password is incorrect.",
      });
      setFocus("current_password");
      return;
    }
    setStatus("UPDATING");

    // sync with server
    const journals = await syncJournals(user.id);
    const updatedJournals: any = [];
    const now = new Date();

    // create new key from new password
    const { key: newKey, salt } = await createNewKeyFromPassword(new_password);

    // decrypt then re-encrypt journals
    for (const key in journals) {
      const journal = journals[key];
      const promptId = key.split("_")[1];
      const decrypted = await decrypt(journal.ciphertext, journal.iv);
      const { ciphertext, iv } = await encrypt(decrypted, newKey);
      journal.ciphertext = ciphertext;
      journal.iv = iv;
      journal.promptId = promptId;
      journal.updatedAt = now;
      await journalStore.setItem(`${user.id}_${promptId}`, journal);
      updatedJournals.push({
        promptId,
        ciphertext: Buffer.from(ciphertext),
        iv: Buffer.from(iv),
      });
    }

    // sync new encrypted data and salt with server
    await axios.put("/api/me", {
      salt: Buffer.from(salt),
      journals: updatedJournals,
    });

    // update local crypto store
    await cryptoStore.setItem(`key-${user.id}`, newKey);
    await cryptoStore.setItem(`salt-${user.id}`, salt);
    await cryptoStore.setItem(`updatedAt-${user.id}`, now);
    setKey(newKey);
    setStatus("PASSWORD_UPDATED");
  };

  if (status === "PASSWORD_UPDATED") {
    return (
      <div className="m-12 rounded-md bg-green-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <CheckCircleIcon
              className="h-5 w-5 text-green-400"
              aria-hidden="true"
            />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">
              Password Updated
            </h3>
            <div className="mt-2 text-sm text-green-700">
              <p>
                Your password has been updated. You&apos;ll need to enter your
                new password into any other devices you&apos;re using to access
                your journal.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="m-12">
      <form onSubmit={handleSubmit(onSubmit)} className="md:w-5/12">
        <h2 className="text-xl mb-4">Update Journal Password</h2>
        <label
          htmlFor="current_password"
          className={clsx("block text-sm font-medium text-gray-700", {
            "text-red-500": errors.current_password,
          })}
        >
          {errors.current_password
            ? errors.current_password.message
            : "Current Password"}
        </label>
        <div className="mt-1 rounded-md shadow-sm">
          <input
            type="password"
            id="current_password"
            {...register("current_password", {
              required: "You must provide your current password.",
            })}
            className="block mb-5 w-full min-w-0 rounded-none rounded-r-md border-gray-300 focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
          />
        </div>
        <label
          htmlFor="new_password"
          className={clsx("block text-sm font-medium text-gray-700", {
            "text-red-500": errors.new_password,
          })}
        >
          {errors.new_password ? errors.new_password.message : "New Password"}
        </label>
        <div className="mt-1 rounded-md shadow-sm">
          <input
            type="password"
            id="new_password"
            {...register("new_password", {
              required: "You must provide your new password.",
            })}
            className="block mb-5 w-full min-w-0 rounded-none rounded-r-md border-gray-300 focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
          />
        </div>
        <label
          htmlFor="confirm_new_password"
          className={clsx("block text-sm font-medium text-gray-700", {
            "text-red-500": errors.confirm_new_password,
          })}
        >
          {errors.confirm_new_password
            ? errors.confirm_new_password.message
            : "Confirm New Password"}
        </label>
        <div className="mt-1 rounded-md shadow-sm">
          <input
            type="password"
            id="confirm_new_password"
            {...register("confirm_new_password", {
              required: "You must confirm your new password.",
            })}
            className="block mb-5 w-full min-w-0 rounded-none rounded-r-md border-gray-300 focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
          />
        </div>
        <button disabled={status === "UPDATING"} className="btn-primary mt-5">
          Update
        </button>
      </form>
    </div>
  );
}
