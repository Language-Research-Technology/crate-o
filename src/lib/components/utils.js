export function countReverse(e) {
  return e['@reverse'] ? Object.values(e['@reverse']).reduce((count, refs) => count + refs.length, 0) : 0;
}

export function cacheLabel(def) {
  var label = def.label;
  if (!label) {
    label = def.name;
    if (!label) {
      label = def.id;
      try {
        const url = new URL(label);
        if (url.host) {
          label = url.hash?.slice(1) || url.pathname.split('/').pop();
        }
      } catch (error) {
      }
    } else {
      let namespace;
      let m = label.match(/(.+):(.+)/);
      if (m) [, namespace, label] = m;
    }
    label = label.charAt(0).toUpperCase() + label.slice(1);
    label = label.replace(/([a-z])([A-Z])/g, '$1 $2');
    def.label = label;
  }
  //if (typeof label !== 'string') label = 'error';
  return label;
}