import { useRouter } from "next/router";
import { signIn } from "next-auth/react";
import { useAppDispatch, useAppSelector } from "src/store";
import { selectUser } from "src/store/user";
import dynamic from "next/dynamic";
import { clsx } from "clsx";

import { FloatingActionButton } from "./FloatingActionButton";

const MarkdownEditor = dynamic(() => import("src/components/MarkdownEditor"), {
  ssr: false,
});

export function JournalPrompt({ prompt }) {
  const user = useAppSelector(selectUser);

  return (
    <div
      className={clsx("container max-w-3xl py-3 px-4 sm:px-6 lg:px-8", {
        "py-7": !user,
      })}
    >
      <h2 className="text-center mt-1 text-2xl text-gray-900">
        {prompt?.text || ""}
      </h2>
      <div className="mt-6">
        <MarkdownEditor prompt={prompt} />
      </div>
      <div className="text-center">
        {user ? (
          <>
            <p>Your journal is saved with end-to-end encryption.</p>
            <p>Only you can read your journal.</p>
          </>
        ) : (
          <p>
            Sign in to save your journal to the cloud with end-to-end
            encryption.
          </p>
        )}

        <div>
          {!user && (
            <a
              role="button"
              className="btn-primary mt-2"
              data-test="sign-in-button"
              href={`/api/auth/signin`}
              onClick={(e) => {
                e.preventDefault();
                signIn();
              }}
            >
              Sign In
            </a>
          )}
        </div>
      </div>
      <FloatingActionButton />
    </div>
  );
}
