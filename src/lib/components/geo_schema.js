function spaceDelimitedToLatLng(text) {
  const vals = text.split(/\s+/);
  const result = [];
  for (let i = 0; i < vals.length; i += 2) {
    result.push([vals[i], vals[i + 1]]);
  }
  return result;
}


const toSchemaOrg = {
  box(shape) {
    const b = shape.getBounds();
    const p1 = b.getSouthWest().wrap();
    const p2 = b.getNorthEast().wrap();
    return [p1.lat, p1.lng, p2.lat, p2.lng].join(' ');
  },
  circle(shape) {
    const { lat, lng } = shape.getLatLng();
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
    console.log(points);

    if (!Array.isArray(points[0])) {
      return points.map(p => p.lat + ' ' + p.lng).join(' ');
    } else {
      return points[0].map(p => p.lat + ' ' + p.lng).join(' ');
    }
  }
};

export function GeoCoordinates(L) {
  return {
    shapes: ['point'],
    from(entity) {
      const result = [];
      if (entity.latitude && entity.longitude) {
        const len = Math.min(entity.latitude.length, entity.longitude.length);
        for (let i = 0; i < len; ++i) {
          result.push(L.marker([entity.latitude[i], entity.longitude[i]], { kind: 'point' }));
        }
      }
      return result;
    },
    to(shapes, entity = {}) {
      const latitude = [], longitude = [];
      for (const shape of shapes) {
        if (shape instanceof L.Marker) {
          const {lat, lng} = shape.getLatLng();
          latitude.push(lat);
          longitude.push(lng);
        }
      }
      entity.latitude = latitude;
      entity.longitude = longitude;
      return entity;
    }
  }
}

export function GeoShape(L) {
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

  return {
    shapes: Object.keys(fromSchemaOrg),
    from(entity) {
      const result = [];
      for (const type in fromSchemaOrg) {
        if (entity[type]) {
          result.push(...(entity[type].map(text => fromSchemaOrg[type](text))));
        }
      }
      return result;
    },
    to(shapes, entity = {}) {
      const data = {};
      for (const shape of shapes) {
        const shapeType = shape.options.kind;
        if (toSchemaOrg[shapeType]) {
          if (!data[shapeType]) data[shapeType] = [];
          data[shapeType].push(toSchemaOrg[shapeType](shape));
        }
      }
      for (const t in toSchemaOrg) {
        entity[t] = data[t];
      }
      return entity;
    }

  };
}

