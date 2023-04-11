import { useRouter } from "next/router";
import { signIn } from "next-auth/react";
import { useAppDispatch, useAppSelector } from "src/store";
import { selectLoadingState } from "src/store/loading";
import { selectUser } from "src/store/user";
import dynamic from "next/dynamic";
import { clsx } from "clsx";

import { FloatingActionButton } from "./FloatingActionButton";

const QuillEditor = dynamic(() => import("src/components/QuillEditor"), {
  ssr: false,
});
const DemoEditor = dynamic(() => import("src/components/landing/DemoEditor"), {
  ssr: false,
});

export function JournalView({ prompt, journal }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const user = useAppSelector(selectUser);
  const loading = useAppSelector(selectLoadingState);

  return (
    <div className={"container max-w-3xl py-3"}>
      <h2 className="text-center mt-1 text-2xl text-gray-900">
        {prompt?.text || ""}
      </h2>
      <div className="my-6">
        {user ? (
          <QuillEditor
            {...{ user, prompt, router, loading, dispatch, journal }}
          />
        ) : (
          <DemoEditor {...{ loading, dispatch }} />
        )}
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
          {user ? (
            <FloatingActionButton />
          ) : (
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
    </div>
  );
}
