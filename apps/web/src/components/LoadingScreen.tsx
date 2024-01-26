import { useRouter } from "next/router";
import { useAppSelector } from "src/store";
import { selectLoadingState } from "src/store/loading";
import { getPathRoot } from "src/utils/path";

export function LoadingScreen() {
  const router = useRouter();
  const pathRoot = getPathRoot(router.pathname);
  const loading = useAppSelector(selectLoadingState);
  const ignoredItems = {};

  if (!["/", "/[slug]"].includes(pathRoot)) {
    ignoredItems["editor"] = true;
  }

  if (
    Object.keys(loading).some((item) => loading[item] && !ignoredItems[item])
  ) {
    return (
      <div className="fixed top-0 right-0 bottom-0 left-0 z-40 bg-white pt-[21vh]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
          <h1 className="mt-4 text-2xl">Loading...</h1>
        </div>
      </div>
    );
  } else return null;
}
