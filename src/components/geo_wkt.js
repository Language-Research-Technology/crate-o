
const reRoot = /^(<.+>\s+)?(\w+)\s*(\(.+\))$/s;
const reBrackets = /a/;

/**
 * Read a WKT formatted string and return a leaflet layer object
 * @param {Object} L 
 * @param {string} wkt 
 */
function read(L, wkt) {
  const m = wkt.trim().match(reRoot);
  const [, srs, type = '', data] = m ?? [];
  if (!type || !data) return;
  const points = parsePoints(data);
  switch (type.toUpperCase()) {
    case 'POINT':
      return L.marker(points[0], { kind: 'point' });
    case 'LINESTRING':
      return L.polyline(points, { kind: 'line' });
    case 'POLYGON':
      const box = polygonToBox(points);
      if (box) {
        return L.rectangle(box, { kind: 'box' });
      } else {
        return L.polygon(points, { kind: 'polygon' });
      }
    case 'CIRCLE':
      const [[latlng], radius] = points;
      return L.circle(latlng, { kind: 'circle', radius });
    default:
      break;
  }
}

/**
 * Parse points to a nested arrays of [latitude,longitude]
 * Default order of the input coordinates follows WGS 84 which is longitude-latitude.
 * @param {string} text - nested list of points grouped by brackets, eg: (35 10, 45 45, 15 40, 10 20, 35 10),(20 30, 35 35, 30 20, 20 30)
 */
function parsePoints(text, latlng) {
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
          const point = ptext.trim().split(/\s+/);
          if (point.length > 1) {
            var lat, lng;
            if (latlng) [lat, lng] = point;
            else[lng, lat] = point;
            if (lng && lat) current.push([+lat, +lng]);
          } else {
            current.push(+point[0]);
          }
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

/**
 * Check if a polygon is a rectangle and return the bottom left and top right corner coordinates
 * @param {Array} polygons 
 * @return {L.LatLngTuple[]}
 */
function polygonToBox(polygons) {
  if (polygons.length !== 1) return;
  const polygon = polygons[0];
  if (polygon.length === 5) {
    const lats = [], lngs = [];
    for (let i = 0; i < 4; ++i) {
      if (polygon[i][0] === polygon[i + 1][0]) lats.push(polygon[i][0]);
      else if (polygon[i][1] === polygon[i + 1][1]) lngs.push(polygon[i][1]);
    }
    if (lats.length === 2 && lngs.length === 2) {
      const [bottom, top] = lats.sort();
      const [left, right] = lngs.sort();
      return [[+bottom, +left], [+top, +right]];
    }
  }
}

/**
 * Build WKT string with WGS 84 longitude-latitude as default SRS
 */
function writer(L) {
  const writers = [
    [L.Marker, l => {
      const p = l.getLatLng();
      return `POINT (${p.lng} ${p.lat})`;
    }],
    [L.Rectangle, l => {
      const bounds = l.getBounds();
      if (bounds.isValid()) {
        const n = bounds.getNorth();
        const e = bounds.getEast();
        const s = bounds.getSouth();
        const w = bounds.getWest();
        const points = [[w, s], [w, n], [e, n], [e, s], [w, s]].map(p => p.join(' ')).join(', ');
        return `POLYGON ((${points}))`;
      }
    }],
    [L.Polygon, l => {
      const points = l.getLatLngs().map(p => (p.push(p[0]), p)).
        map(p => '(' + p.map(c => `${c.lng} ${c.lat}`).join(', ') + ')').join(', ');
      return `POLYGON (${points})`;
    }],
    [L.Polyline, l => {
      const points = l.getLatLngs().map(c => `${c.lng} ${c.lat}`).join(', ');
      return `LINESTRING (${points})`;
    }],
    [L.Circle, l => {
      const p = l.getLatLng();
      const r = l.getRadius();
      return `CIRCLE ((${p.lng} ${p.lat}), ${r})`;
    }]
  ];
  return function(layer) {
    for (const [c, fn] of writers) {
      if (layer instanceof c) {
        return fn(layer);
      }
    }
  }
}


export function Geometry(L) {
  /**
   * Build WKT string with WGS 84 longitude-latitude as default SRS
   */
  const write = writer(L);

  return {
    //shapes: ['point', 'line', 'box', 'circle', 'polygon'],
    shapes: ['point', 'box', 'polygon'],
    from(entity) {
      const wkt = entity['http://www.opengis.net/ont/geosparql#asWKT'] || entity['asWKT'] || entity['geo:asWKT'] || [];
      return wkt.map(data => read(L, data));
    },
    to(shapes, entity = {}) {
      entity.asWKT = shapes.map(s => write(s));
      return entity;
    }

  };
}

export const _private = {
  parsePoints,
  polygonToBox,
  read,
  writer
};