import dynamic from "next/dynamic";
import { useRouter } from "next/router";

import { useAppDispatch, useAppSelector } from "src/store";
import { selectLoadingState } from "src/store/loading";
import { selectUser } from "src/store/user";

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
    </div>
  );
}
