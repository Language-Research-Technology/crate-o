/** Geo format transformation utils */
import { Geometry } from './geo_wkt';
import { GeoShape, GeoCoordinates } from './geo_schema';

export default function (L, entity = {'@type':[]}) {
  const Transformers = {
    GeoCoordinates: GeoCoordinates(L),
    GeoShape: GeoShape(L),
    Geometry: Geometry(L)
  };
  Transformers["http://www.opengis.net/ont/geosparql#Geometry"] = Transformers[Geometry];

  return {
    get shapes() {
      const shapes = new Set();
      for (const t of entity['@type']) {
        for (const s of Transformers[t]?.shapes) shapes.add(s);
      }
      return Array.from(shapes);
    },
    fromEntity() {
      // convert from entity to leaflet shapes
      if (entity) {
        //console.log(entity['@type']);
        return entity['@type'].reduce((a, t) => a.concat(Transformers[t]?.from(entity) || []), []);
      }
    },
    toEntity(shapes) {
      // update entity with the given shapes
      for (const t of entity['@type']) {
        Transformers[t]?.to(shapes, entity);
      }
      return entity;
    }
  };
}
