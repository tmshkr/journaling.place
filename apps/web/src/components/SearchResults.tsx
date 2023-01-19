import Link from "next/link";
export function SearchResults({
  search,
  setSearch,
  searchResults,
  setSearchResults,
}) {
  if (searchResults.length === 0) {
    return null;
  }
  return (
    <div className="absolute w-full bg-white border border-gray-200 rounded-md shadow-lg">
      {searchResults.map((result) => {
        const promptId = result.split("_")[1];
        return (
          <Link
            key={result}
            href={`/${promptId}`}
            onClick={() => {
              setSearch("");
              setSearchResults([]);
            }}
            className="block font-medium text-gray-900"
          >
            {result}
          </Link>
        );
      })}
    </div>
  );
}
