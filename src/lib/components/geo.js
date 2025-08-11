/** Geo format transformation utils */
import { Geometry } from './geo_wkt';
import { GeoShape, GeoCoordinates } from './geo_schema';

export default function (L) {
  const Transformers = {
    GeoCoordinates: GeoCoordinates(L),
    GeoShape: GeoShape(L),
    Geometry: Geometry(L)
  };
  Transformers["https://schema.org/GeoCoordinates"] = Transformers.GeoCoordinates;
  Transformers["https://schema.org/GeoShape"] = Transformers.GeoShape;
  Transformers["http://www.opengis.net/ont/geosparql#Geometry"] = Transformers.Geometry;

  return {
    shapes(entity = {'@type':[]}) {
      return new Set((entity['@type']||[]).flatMap(type => Transformers[type]?.shapes || []));
    },
    fromEntity(entity = {'@type':[]}) {
      // convert from entity to leaflet shapes
      if (entity) {
        //console.log(entity['@type']);
        return entity['@type'].reduce((a, t) => a.concat(Transformers[t]?.from(entity) || []), []);
      }
    },
    toEntity(shapes, entity = {'@type':[]}) {
      // update entity with the given shapes
      for (const t of entity['@type']) {
        Transformers[t]?.to(shapes, entity);
      }
      return entity;
    }
  };
}
