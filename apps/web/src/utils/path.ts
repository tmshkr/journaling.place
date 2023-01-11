// matches first path segment, e.g. /projects from /projects/[id]
export function getPathRoot(str) {
  return str.match(/(\/[^\/]*)/)[1] || "";
}
