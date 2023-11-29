export function countReverse(e) {
    return e['@reverse'] ? Object.values(e['@reverse']).reduce((count, refs) => count + refs.length, 0) : 0;
}
  