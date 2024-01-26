import { useEffect, useState } from "react";
import { Dialog } from "@headlessui/react";
import { useSession } from "next-auth/react";
import { createKey } from "src/services/crypto";
import { useForm } from "react-hook-form";

const buttonClasses =
  "inline-flex m-2 items-center gap-x-2 rounded-md bg-indigo-600 py-2.5 px-3.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600";

const inputClasses =
  "block w-full rounded-md border-0 py-1.5 my-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6";

enum PasswordInputState {
  CreatePassword,
  ConfirmPassword,
  EnterPassword,
}

export function PasswordInput() {
  const user: any = useSession().data?.user;
  const [passwordInputState, setPasswordInputState] = useState(
    user.salt
      ? PasswordInputState.EnterPassword
      : PasswordInputState.CreatePassword
  );

  const {
    register,
    handleSubmit,
    formState,
    setError,
    setFocus,
    setValue,
    reset,
  } = useForm();
  const { errors }: { errors: any } = formState;
  const hasErrors = Object.keys(errors).length > 0;

  const onSubmit = async (values) => {
    const { password, confirm_password } = values;

    switch (passwordInputState) {
      case PasswordInputState.CreatePassword:
        setPasswordInputState(PasswordInputState.ConfirmPassword);
        setValue("confirm_password", "");
        setFocus("confirm_password");
        return;
      case PasswordInputState.ConfirmPassword:
        if (password !== confirm_password) {
          setError("confirm_password", {
            message: "Passwords do not match.",
          });
          setFocus("confirm_password");
          return;
        }
        await createKey(password);
        break;
      case PasswordInputState.EnterPassword:
        await createKey(password).catch((err) => {
          if (err.message === "Decryption failed") {
            setError("password", {
              message: "Incorrect password.",
            });
            setFocus("password");
          }
        });
        break;
      default:
        throw new Error("Invalid password input state.");
    }
  };

  useEffect(() => {
    setFocus("password");
  }, []);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="text-center">
      <Dialog.Title
        as="label"
        htmlFor={
          passwordInputState === PasswordInputState.ConfirmPassword
            ? "confirm_password"
            : "password"
        }
        className="block text-md font-medium leading-6 text-gray-900"
      >
        {passwordInputState === PasswordInputState.EnterPassword
          ? "Journal Password"
          : "Create Password"}
      </Dialog.Title>
      <div className="mt-2">
        {passwordInputState === PasswordInputState.ConfirmPassword ? (
          <input
            id="confirm_password"
            aria-label="confirm password"
            type="password"
            className={inputClasses}
            disabled={hasErrors}
            {...register("confirm_password", {
              required: "You must confirm your password.",
            })}
          />
        ) : (
          <input
            id="password"
            aria-label="enter password"
            type="password"
            className={inputClasses}
            {...register("password", {
              required: "You must provide your password.",
            })}
          />
        )}
      </div>
      <InputDescription {...{ errors, hasErrors, passwordInputState }} />
      <SubmitButton
        {...{
          errors,
          passwordInputState,
          hasErrors,
          reset,
          setPasswordInputState,
        }}
      />
    </form>
  );
}

function InputDescription({ passwordInputState, errors, hasErrors }) {
  if (hasErrors) {
    return Object.keys(errors).map((key) => (
      <Dialog.Description key={key} className="text-sm text-red-500 my-2">
        {errors[key].message}
      </Dialog.Description>
    ));
  }

  switch (passwordInputState) {
    case PasswordInputState.CreatePassword:
      return (
        <Dialog.Description className="text-sm text-gray-500 my-2">
          Please enter a password to encrypt your journal.
          <br />
          Use a strong password and store it in a safe place.
          <br />
          If you lose your password, your data cannot be recovered.
        </Dialog.Description>
      );
    case PasswordInputState.ConfirmPassword:
      return (
        <Dialog.Description className="text-sm text-gray-500 my-2">
          Please confirm your password.
        </Dialog.Description>
      );
    case PasswordInputState.EnterPassword:
      return (
        <Dialog.Description className="text-sm text-gray-500 my-2">
          Please enter your password to access your journal.
        </Dialog.Description>
      );
    default:
      throw new Error("Invalid password input state.");
  }
}

function SubmitButton({
  passwordInputState,
  errors,
  hasErrors,
  reset,
  setPasswordInputState,
}) {
  switch (passwordInputState) {
    case PasswordInputState.CreatePassword:
      return (
        <button id="password_submit" type="submit" className={buttonClasses}>
          Next
        </button>
      );
    case PasswordInputState.ConfirmPassword:
      return hasErrors ? (
        <button
          id="password_submit"
          onClick={(e) => {
            e.preventDefault();
            setPasswordInputState(PasswordInputState.CreatePassword);
            reset();
          }}
          className={buttonClasses}
        >
          Try Again
        </button>
      ) : (
        <button id="password_submit" type="submit" className={buttonClasses}>
          Submit
        </button>
      );
    case PasswordInputState.EnterPassword:
      return (
        <button id="password_submit" type="submit" className={buttonClasses}>
          Submit
        </button>
      );
    default:
      throw new Error("Invalid password input state.");
  }
}
