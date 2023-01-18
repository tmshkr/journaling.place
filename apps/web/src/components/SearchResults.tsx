export function SearchResults({ searchResults }) {
  if (searchResults.length === 0) {
    return null;
  }
  return (
    <div className="absolute w-full bg-white border border-gray-200 rounded-md shadow-lg">
      {searchResults.map((result) => (
        <p key={result} className="text-sm font-medium text-gray-900">
          {result}
        </p>
      ))}
    </div>
  );
}
