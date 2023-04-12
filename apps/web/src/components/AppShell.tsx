import { Fragment, useState, useEffect, useRef } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  Bars3BottomLeftIcon,
  CloudIcon,
  FolderIcon,
  HomeIcon,
  XMarkIcon,
  Cog6ToothIcon,
  LockClosedIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { ArrowPathIcon } from "@heroicons/react/20/solid";
import { clsx } from "clsx";
import { useQuery, useMutation, useQueryClient } from "react-query";

import { useAppSelector } from "src/store";
import { selectUser } from "src/store/user";
import { getPathRoot } from "src/utils/path";
import { getJournals } from "src/store/journal";
import { selectNetworkStatus } from "src/store/network";

import { SearchBar } from "./SearchBar";
import { SearchResults } from "./SearchResults";
import { FloatingActionButton } from "src/components/FloatingActionButton";

import Link from "next/link";
import { useRouter } from "next/router";
import journalIcon from "public/favicon-32x32.png";

import styles from "./AppShell.module.scss";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function AppShell({ children }) {
  const spinnerTimeoutRef: any = useRef(null);
  const [statusIcon, setStatusIcon] = useState("idle");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [search, setSearch] = useState("");

  const router = useRouter();
  const user = useAppSelector(selectUser);
  const networkStatus = useAppSelector(selectNetworkStatus);

  const queryClient = useQueryClient();

  useEffect(() => {
    if (user && !queryClient.isFetching("journal")) {
      queryClient.fetchQuery("journal", () => getJournals());
    }
  }, [user]);

  useEffect(() => {
    clearTimeout(spinnerTimeoutRef.current);
    if (networkStatus === "pending") {
      setStatusIcon(networkStatus);
    } else {
      spinnerTimeoutRef.current = setTimeout(() => {
        setStatusIcon(networkStatus);
      }, 500);
    }
  }, [networkStatus]);

  const statusIcons = {
    pending: (
      <ArrowPathIcon
        className={clsx("h-6 w-6", styles.spinning)}
        aria-hidden="true"
      />
    ),
    succeeded: <CloudIcon className="h-6 w-6" aria-hidden="true" />,
    idle: <CloudIcon className="h-6 w-6" aria-hidden="true" />,
    failed: <ExclamationCircleIcon className="h-6 w-6" aria-hidden="true" />,
  };

  const pathRoot = getPathRoot(router.pathname);

  const navigation = [
    { name: "Home", href: "/", icon: HomeIcon, current: pathRoot === "/" },
    {
      name: "Journal",
      href: "/journal",
      icon: FolderIcon,
      current: pathRoot === "/journal",
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Cog6ToothIcon,
      current: pathRoot === "/settings",
    },
    {
      name: "Log Out",
      href: "/logout",
      icon: LockClosedIcon,
      current: pathRoot === "/logout",
      requiresAuth: true,
    },
  ];

  return (
    <div data-test="app-shell">
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-40 md:hidden"
          onClose={setSidebarOpen}
        >
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </Transition.Child>

          <div className="fixed inset-0 z-40 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative flex w-full max-w-xs flex-1 flex-col bg-white pt-5 pb-4">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute top-0 right-0 -mr-12 pt-2">
                    <button
                      type="button"
                      className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon
                        className="h-6 w-6 text-white"
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </Transition.Child>
                <div className="flex flex-shrink-0 items-center px-4">
                  {/* <img
                      className="h-8 w-auto"
                      src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600"
                      alt="Your Company"
                    /> */}
                  <img className="inline pr-2" src={journalIcon.src} />
                  <h1>journaling.place</h1>
                </div>
                <div className="mt-5 h-0 flex-1 overflow-y-auto">
                  <nav className="space-y-1 px-2">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={classNames(
                          item.current
                            ? "bg-gray-100 text-gray-900"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                          "group flex items-center px-2 py-2 text-base font-medium rounded-md"
                        )}
                      >
                        <item.icon
                          className={classNames(
                            item.current
                              ? "text-gray-500"
                              : "text-gray-400 group-hover:text-gray-500",
                            "mr-4 flex-shrink-0 h-6 w-6"
                          )}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    ))}
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
            <div className="w-14 flex-shrink-0" aria-hidden="true">
              {/* Dummy element to force sidebar to shrink to fit close icon */}
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        {/* Sidebar component, swap this element with another sidebar if you like */}
        <div className="flex flex-grow flex-col overflow-y-auto border-r border-gray-200 bg-white pt-5">
          <div className="flex flex-shrink-0 items-center px-4">
            <Link href="/">
              <img className="inline pr-2" src={journalIcon.src} />
              <h1 className="inline h-8 w-auto">journaling.place</h1>
            </Link>
          </div>
          <div className="mt-5 flex flex-grow flex-col">
            <nav className="flex-1 space-y-1 px-2 pb-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={classNames(
                    item.current
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                    "group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                  )}
                >
                  <item.icon
                    className={classNames(
                      item.current
                        ? "text-gray-500"
                        : "text-gray-400 group-hover:text-gray-500",
                      "mr-3 flex-shrink-0 h-6 w-6"
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col md:pl-64">
        <div className={"sticky top-0 left-0 right-0 bg-white shadow z-10"}>
          <div className="flex h-16 flex-shrink-0">
            <button
              type="button"
              className="border-r border-gray-200 px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <Bars3BottomLeftIcon className="h-6 w-6" aria-hidden="true" />
            </button>
            <div className="flex flex-1 justify-between px-4">
              <SearchBar {...{ search, setSearch, setSearchResults, user }} />
              <div className="ml-4 flex items-center md:ml-6">
                <button
                  type="button"
                  className="rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <span className="sr-only">View notifications</span>
                  {statusIcons[statusIcon]}
                </button>
              </div>
            </div>
          </div>

          <SearchResults
            {...{ search, setSearch, searchResults, setSearchResults }}
          />
        </div>

        <main>{children}</main>
        <FloatingActionButton />
      </div>
    </div>
  );
}
