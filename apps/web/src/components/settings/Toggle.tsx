import { useState } from "react";
import axios from "axios";
import { useAppDispatch, useAppSelector } from "src/store";
import { selectUser, setUser, clearUser } from "src/store/user";
import { Switch } from "@headlessui/react";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function Toggle() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const [enabled, setEnabled] = useState(user.isSubscribedPOTD);

  const toggle = (newValue) => {
    setEnabled(newValue);
    axios
      .put("/api/me/email", {
        isSubscribedPOTD: newValue,
      })
      .then(() => {
        dispatch(setUser({ ...user, isSubscribedPOTD: newValue }));
      })
      .catch((err) => {
        setEnabled(!newValue);
        console.log(err);
      });
  };

  return (
    <Switch.Group
      as="div"
      className="flex items-center justify-between md:w-5/12 mb-12"
    >
      <span className="flex flex-grow flex-col">
        <Switch.Label
          as="span"
          className="text-sm font-medium leading-6 text-gray-900"
          passive
        >
          Prompt of the Day
        </Switch.Label>
        <Switch.Description as="span" className="text-sm text-gray-500">
          Subscribe to the daily prompt email.
        </Switch.Description>
      </span>
      <Switch
        checked={enabled}
        onChange={(newValue) => toggle(newValue)}
        className={classNames(
          enabled ? "bg-indigo-600" : "bg-gray-200",
          "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
        )}
      >
        <span
          aria-hidden="true"
          className={classNames(
            enabled ? "translate-x-5" : "translate-x-0",
            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
          )}
        />
      </Switch>
    </Switch.Group>
  );
}
