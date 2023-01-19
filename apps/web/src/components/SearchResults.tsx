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
      {searchResults.map((key, index) => {
        const promptId = key.split("_")[1];
        return (
          <Link
            key={`${key}#${index}`}
            href={`/${promptId}`}
            onClick={() => {
              setSearch("");
              setSearchResults([]);
            }}
            className="block font-medium text-gray-900 px-4 py-2"
          >
            <h3
              className="truncate font-medium text-indigo-600"
              dangerouslySetInnerHTML={{
                __html: cache[key].promptText.replace(
                  new RegExp(search, "gi"),
                  (match) => {
                    return `<span class="bg-yellow-300">${match}</span>`;
                  }
                ),
              }}
            />

            <p
              className="truncate font-medium text-gray-400"
              dangerouslySetInnerHTML={{
                __html: cache[key].plaintext.replace(
                  new RegExp(search, "gi"),
                  (match) => {
                    return `<span class="bg-yellow-300">${match}</span>`;
                  }
                ),
              }}
            />
          </Link>
        );
      })}
    </div>
  );
}
