import { useState } from "react";
import { SwitchGroup, SwitchLabel, SwitchDescription, Switch } from "@headlessui/react";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function Toggle(props) {
  const { name, description, onToggle } = props;
  const [enabled, setEnabled] = useState(props.enabled);

  const toggle = (newValue) => {
    setEnabled(newValue);
    onToggle(newValue).catch(() => setEnabled(!newValue));
  };

  return (
    <SwitchGroup>
      <div className="flex items-center justify-between md:w-5/12 mb-12">
        <span className="flex flex-grow flex-col">
          <SwitchLabel className="text-sm font-medium leading-6 text-gray-900" passive>
            {name}
          </SwitchLabel>
          <SwitchDescription className="text-sm text-gray-500">
            {description}
          </SwitchDescription>
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
      </div>
    </SwitchGroup>
  );
}
