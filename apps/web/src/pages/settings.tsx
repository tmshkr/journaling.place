import { useState } from "react";
import { useAppSelector } from "src/store";
import { selectUser } from "src/store/user";
import { CheckCircleIcon } from "@heroicons/react/20/solid";
import { useForm } from "react-hook-form";
import { clsx } from "clsx";
import { Toggle } from "src/components/settings/Toggle";
import { useRouter } from "next/router";

import { changePassword } from "src/lib/crypto";

export default function SettingsPage() {
  const user = useAppSelector(selectUser);
  const router = useRouter();
  const [status, setStatus] = useState(router.query.status || "READY");
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

    setStatus("UPDATING");

    await changePassword(current_password, new_password)
      .then(() => {
        window.location.href += "?status=PASSWORD_UPDATED";
      })
      .catch((err) => {
        if (err.message === "Incorrect password") {
          setError("current_password", {
            message: "Current password is incorrect.",
          });
          setStatus("READY");
          setFocus("current_password");
        } else throw err;
      });
  };

  if (status === "PASSWORD_UPDATED") {
    return (
      <div
        className="m-12 rounded-md bg-green-50 p-4"
        data-test="update-password-success"
      >
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
      <h2 className="neuton text-xl mb-4">Email Preferences</h2>
      <Toggle />
      <form onSubmit={handleSubmit(onSubmit)} className="md:w-5/12">
        <h2 className="neuton text-xl mb-4">Update Journal Password</h2>
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
            data-test="current-password"
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
            data-test="new-password"
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
            data-test="confirm-password"
            id="confirm_new_password"
            {...register("confirm_new_password", {
              required: "You must confirm your new password.",
            })}
            className="block mb-5 w-full min-w-0 rounded-none rounded-r-md border-gray-300 focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
          />
        </div>
        <button
          data-test="update-password"
          disabled={status === "UPDATING"}
          className="btn-primary mt-5"
        >
          Update Password
        </button>
      </form>
    </div>
  );
}
