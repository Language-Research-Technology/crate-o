/** Geo format transformation utils */

import * as L from "leaflet";
import "leaflet.path.drag";

function spaceDelimitedToLatLng(text) {
  const vals = text.split(/\s+/);
  const result = [];
  for (let i = 0; i < vals.length; i += 2) {
    result.push([vals[i], vals[i + 1]]);
  }
  return result;
}

const fromSchemaOrg = {
  box(text) {
    return L.rectangle(spaceDelimitedToLatLng(text), { kind: 'box' });
    //return ['box', spaceDelimitedToLatLng(text)];
  },
  circle(text) {
    const vals = text.split(' ');
    //return ['circle', [vals[0], vals[1]], { radius: vals[2] }];
    return L.circle([vals[0], vals[1]], { kind: 'circle', radius: vals[2] });
  },
  line(text) {
    //return ['line', spaceDelimitedToLatLng(text)];
    return L.polyline(spaceDelimitedToLatLng(text), { kind: 'line' });
  },
  polygon(text) {
    //return ['polygon', spaceDelimitedToLatLng(text)];
    return L.polygon(spaceDelimitedToLatLng(text), { kind: 'polygon' });
  }
};

const toSchemaOrg = {
  box(shape) {
    const b = shape.getBounds();
    const p1 = b.getSouthWest().wrap();
    const p2 = b.getNorthEast().wrap();
    return [p1.lat, p1.lng, p2.lat, p2.lng].join(' ');
  },
  circle(shape) {
    const {lat, lng} = shape.getLatLng();
    return [lat, lng, shape.getRadius()].join(' ');
  },
  line(shape) {
    const points = shape.getLatLngs();
    if (!Array.isArray(points[0])) {
      return points.map(p => p.lat + ' ' + p.lng).join(' ');
    }
  },
  polygon(shape) {
    const points = shape.getLatLngs();
    if (!Array.isArray(points[0])) {
      return points.map(p => p.lat + ' ' + p.lng).join(' ');
    }
  }
};

function convertFromSchemaOrg(val) {
  const result = [];
  if (val.latitude && val.longitude) {
    const len = Math.min(val.latitude.length, val.longitude.length);
    for (let i = 0; i < len; ++i) {
      result.push(['point', [val.latitude[i], val.longitude[i]]]);
    }
  }
  for (const type in fromSchemaOrg) {
    if (val[type]) {
      result.push(...(val[type].map(text => fromSchemaOrg[type](text))));
    }
  }
  return result;
}

function convertFromGeometry(val) {
  const wkt = val['http://www.opengis.net/ont/geosparql#asWKT'] || val['asWKT'] || [];
  return wkt.map(v => {
    var m = v.match(/(\w+)\s*\((.+)\)/);
    if (!m) return;
    const [, shape, data] = m;
    switch (shape.toUpperCase()) {
      case 'POINT':
        const [lng, lat] = data.split(/\s+/);
        return ['point', [+lat, +lng]];
        break;
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
  });
}

function polygonToBox(polygon) {
  if (polygon.length === 5) {
    const lats = [], lngs = [];
    for (let i=0; i<4; ++i) {
      if (polygon[i][0] === polygon[i+1][0]) lats.push(polygon[i][0]);
      else if (polygon[i][1] === polygon[i+1][1]) lngs.push(polygon[i][1]);
    }
    if (lats.length === 2 && lngs.length === 2) {
      const [bottom, top] = lats.sort();
      const [left, right] = lngs.sort();
      return [[bottom, left],[top, right]];
    }
  }
}

const convertFrom = {
  GeoShape: convertFromSchemaOrg,
  GeoCoordinates: convertFromSchemaOrg,
  "http://www.opengis.net/ont/geosparql#Geometry": convertFromGeometry
};

const convertTo = {
  GeoShape(entity, shapes) {
    const data = {};
    for (const shape of shapes) {
      const shapeType = shape.options.kind;
      if (toSchemaOrg[shapeType]) {
        if (!data[shapeType]) data[shapeType] = [];
        data[shapeType].push(toSchemaOrg[shapeType](shape));
      }
    }
    return Object.assign(entity, data);
  },
  GeoCoordinates(entity, shapes) {
    const data = { latitude: [], longitude: [] };
    for (const shape of shapes) {
      if (shape.options.kind === 'point') {
        const {lat, lng} = shape.getLatLng();
        data.latitude.push(lat);
        data.longitude.push(lng);
      }
    }
    return Object.assign(entity, data);
  },
  "http://www.opengis.net/ont/geosparql#Geometry": function(entity, shapes) {

  }
};

export function fromEntity(entity) {
  if (entity) {
    console.log(entity['@type']);
    return entity['@type'].reduce((a, t) => a.concat(convertFrom[t]?.(entity) || []), []);
  }
}

export function updateEntity(entity, shapes) {
  if (entity) {
    console.log(entity['@type']);
    return entity['@type'].reduce((e, t) => convertTo[t]?.(e, shapes) || e, entity);
  }
}