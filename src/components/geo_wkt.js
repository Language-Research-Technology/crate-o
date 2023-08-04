import * as L from "leaflet";

const reRoot = /^(\w+)\s*\((.+)\)$/s;
const reBrackets = /a/;

/**
 * @param {string} wkt 
 */
export function read(wkt) {
  const m = wkt.trim().match(reRoot);
  const [, type = '', data] = m ?? []; 
  switch (type.toUpperCase()) {
    case 'POINT':
      return L.marker(parsePoints(data)[0], { kind: 'point' });
    case 'LINESTRING':
      m = data.match(/\(\s*([,\d\s]+)\s*\)/);
      if (m) {
        const line = m[1].split(',').map(s => s.trim().split(/\s+/));
        return ['line', line];
      }
      break;
    case 'POLYGON':
      m = data.match(/\(\s*\(\s*([,\d\s]+)\s*\)\s*\)/);
      if (m) {
        const polygon = m[1].split(',').map(s => s.trim().split(/\s+/));
        const box = polygonToBox(polygon);
        if (box) {
          return ['box', box];
        } else {
          return ['polygon', polygon];
        }
      }
      break;
    case 'CIRCLE':
      m = data.match(/\(\s*(\d+\.?\d*)\s+(\d+\.?\d*)\s*\)\s*,\s*(\d+\.?\d*)/);
      if (m) {
        const [, lng, lat, radius] = m;
        return ['circle', [lat, lng], { radius }];
      }
      break;
    default:
      break;
  }


}

export function write(layer) {


}

/**
 * Default SRS is WGS 84 longitude-latitude.
 * @param {string} text 
 * @return {L.LatLngTuple[]}
 */
function parsePoints(text) {
  const points = text.split(',');
  return points.map(lnglat => {
    const [lng, lat] = text.trim().split(/\s+/);
    return [+lat, +lng];
  });

}

/**
 * @param {string} text - nested list of points grouped by brackets, eg: (35 10, 45 45, 15 40, 10 20, 35 10),(20 30, 35 35, 30 20, 20 30)
 */
function parsePointsGroups(text) {
  var parents = [];
  var current, prev;
  var ptext = '';
  for (const c of text) {
    switch (c) {
      case '(':
        ptext = '';
        if (current) parents.push(current);
        current = [];
        break;
      case ')':
      case ',':
        if (ptext) {
          const [lng, lat] = ptext.trim().split(/\s+/);
          if (lng && lat) current.push([+lat, +lng]);
          ptext = '';
        } else if (prev) {
          current.push(prev);
          prev = null;
        }
        if (c === ')') {
          prev = current;
          if (parents.length) current = parents.pop();
        }
        break;
      default:
        ptext += c;
        break;
    }
  }
  return current;
}
