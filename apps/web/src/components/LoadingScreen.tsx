import { useAppSelector } from "src/store";
import { selectLoadingState } from "src/store/loading";

export function LoadingScreen() {
  const loading = useAppSelector(selectLoadingState);
  if (Object.keys(loading).some((item) => loading[item])) {
    return (
      <div className="fixed top-0 right-0 bottom-0 left-0 z-50 bg-white pt-[21vh]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
          <h1 className="mt-4 text-2xl">Loading...</h1>
        </div>
      </div>
    );
  } else return null;
}
