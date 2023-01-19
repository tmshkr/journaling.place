import Link from "next/link";
import { useQueryClient } from "react-query";

export function SearchResults({
  search,
  setSearch,
  searchResults,
  setSearchResults,
}) {
  if (searchResults.length === 0) {
    return null;
  }
  const queryClient = useQueryClient();
  const cache = queryClient.getQueryData("journal");

  if (!cache) {
    return null;
  }

  return (
    <div className="absolute w-full bg-white border border-gray-200 rounded-md shadow-lg">
      {searchResults.map((key) => {
        const promptId = key.split("_")[1];
        return (
          <Link
            key={key}
            href={`/${promptId}`}
            onClick={() => {
              setSearch("");
              setSearchResults([]);
            }}
            className="block font-medium text-gray-900"
          >
            {cache[key].promptText}
          </Link>
        );
      })}
    </div>
  );
}
