import dynamic from "next/dynamic";
import { useRouter } from "next/router";

import { useAppDispatch, useAppSelector } from "src/store";
import { selectLoadingState } from "src/store/loading";
import { useSession } from "next-auth/react";
import { selectModal } from "src/store/modal";

const QuillEditor = dynamic(() => import("src/components/QuillEditor"), {
  ssr: false,
});
const DemoEditor = dynamic(() => import("src/components/landing/DemoEditor"), {
  ssr: false,
});

export function JournalView({ prompt, journal }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const user = useSession().data?.user;
  const loading = useAppSelector(selectLoadingState);
  const modal = useAppSelector(selectModal);

  return (
    <div className={"container max-w-3xl py-3"}>
      <h2 className="neuton text-center mt-1 text-2xl text-gray-900">
        {prompt?.text || ""}
      </h2>
      <div className="my-6">
        {user ? (
          <QuillEditor
            {...{ user, prompt, router, loading, dispatch, journal, modal }}
          />
        ) : (
          <DemoEditor {...{ loading, dispatch }} />
        )}
      </div>
    </div>
  );
}
