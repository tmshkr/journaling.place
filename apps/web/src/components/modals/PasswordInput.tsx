import { useEffect } from "react";
import { useRouter } from "next/router";
import { Dialog } from "@headlessui/react";
import { useSession } from "next-auth/react";
import { useAppDispatch, useAppSelector } from "src/store";
import { selectUser } from "src/store/user";
import { selectModal } from "src/store/modal";
import { createKey } from "src/lib/crypto";
import { useForm } from "react-hook-form";

const buttonClasses =
  "inline-flex m-2 items-center gap-x-2 rounded-md bg-indigo-600 py-2.5 px-3.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600";

const inputClasses =
  "block w-full rounded-md border-0 py-1.5 my-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6";

export function PasswordInput() {
  const { update } = useSession();
  const user = useAppSelector(selectUser);

  const hasPassword = !!user.salt;

  const { register, handleSubmit, formState, setError, setFocus } =
    useForm();
  const { errors }: { errors: any; } = formState;

  const onSubmit = async (values) => {
    console.log("values", values);
    const { password, confirm_password } = values;
    if (!hasPassword && password !== confirm_password) {
      console.log("passwords do not match");
      setError("confirm_password", {
        message: "Passwords do not match.",
      });
      setFocus("confirm_password");
      return;
    }
    await createKey(password, user, update);
  };

  useEffect(() => {
    setFocus("password");
  }, []);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="text-center">
      <Dialog.Title
        as="label"
        htmlFor="password"
        className="block text-md font-medium leading-6 text-gray-900"
      >
        Journal Password
      </Dialog.Title>
      <div className="mt-2">
        <input
          id="password"
          type="password"
          {...register("password", {
            required: "You must provide your password.",
          })}
          className={inputClasses}
        />
      </div>
      {!hasPassword && (
        <>
          <label
            htmlFor="confirm_password"
            className="block text-md font-medium leading-6 text-gray-900"
          >
            Confirm Password
          </label>
          <div className="mt-2">
            <input
              id="confirm_password"
              type="password"
              {...register("confirm_password", {
                required: "You must confirm your password.",
              })}
              className={inputClasses}
            />
          </div>
        </>
      )}
      {hasPassword ? (
        <Dialog.Description className="text-sm text-gray-500 my-2">
          Please enter your password to access your journal.
        </Dialog.Description>
      ) : (
        <Dialog.Description className="text-sm text-gray-500 my-2">
          Use a strong password and store it in a safe place.
          <br />
          If you lose your password, your data cannot be recovered.
        </Dialog.Description>
      )}

      <button type="submit" className={buttonClasses}>
        Submit
      </button>
    </form>
  );
}
