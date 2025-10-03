import { test, expect } from '@playwright/test';
import { _private } from './geo_wkt';
const { parsePoints, polygonToBox, read, writer } = _private;

test.describe('unit', { tag: '@unit' }, () => {
  let L;
  let write;
  test.beforeAll(async () => {
    global.window = { screen: { devicePixelRatio: 1 } };
    global.document = {
      documentElement: { style: {} },
      getElementsByTagName: () => [],
      createElement: () => ({})
    };
    L = await import("leaflet");
    write = writer(L);
  });
  // test data in default WGS84 geodetic longitude-latitude spatial reference system
  test.describe('parsePoints', () => {
    test('one point', async () => {
      const s = parsePoints('(30 10)');
      expect(s).toEqual([[10, 30]]);
    });
    test('circle', async () => {
      const s = parsePoints('((111 64), 10000)');
      expect(s).toEqual([[[64, 111]], 10000]);
    });

    test('multi points', async () => {
      let s = parsePoints('(30 10, 10 30)');
      expect(s).toEqual([[10, 30], [30, 10]]);
      s = parsePoints('(30 10, 10 30, 40 50)');
      expect(s).toEqual([[10, 30], [30, 10], [50, 40]]);
    });

    test('one level nested multi points', async () => {
      let s = parsePoints('((30 10, 40 40, 20 40, 10 20, 30 10))');
      expect(s).toEqual([[[10, 30], [40, 40], [40, 20], [20, 10], [10, 30]]]);
      s = parsePoints('((30 10, 40 40, 20 40, 10 20, 30 10), (20 30, 35 35, 30 20, 20 30))');
      expect(s).toEqual([[[10, 30], [40, 40], [40, 20], [20, 10], [10, 30]],
      [[30, 20], [35, 35], [20, 30], [30, 20]]]);
    });

    test('two level nested multi points', async () => {
      let s = parsePoints('(((30 10, 40 40, 20 40, 10 20, 30 10)),((15 5, 40 10, 10 20, 15 5)))');
      expect(s).toEqual([[[[10, 30], [40, 40], [40, 20], [20, 10], [10, 30]]], [[[5, 15], [10, 40], [20, 10], [5, 15]]]]);
      s = parsePoints('(((40 40, 20 45, 45 30, 40 40)), ((20 35, 10 30, 10 10, 30 5, 45 20, 20 35), (30 20, 20 15, 20 25, 30 20)))');
      expect(s).toEqual([[[[40, 40], [45, 20], [30, 45], [40, 40]]],
      [[[35, 20], [30, 10], [10, 10], [5, 30], [20, 45], [35, 20]], [[20, 30], [15, 20], [25, 20], [20, 30]]]]);
    });
  });

  test.describe('polygonToBox', () => {
    test('box', async () => {
      //POLYGON ((32.16764634362565 40, 10 40, 10 25.48295117535531, 32.16796875000001 25.48295117535531, 32.16764634362565 40))
      const p = polygonToBox([[[32.16764634362565, 40], [10, 40], [10, 25.48295117535531], [32.16764634362565, 25.48295117535531], [32.16764634362565, 40]]]);
      //const p = polygonToBox([[[32,40],[10,40],[10,25],[32,25],[32,40]]]);
      //console.log(p);
      expect(p).toEqual([[10, 25.48295117535531], [32.16764634362565, 40]]);
    });

  });

  test.describe('read', () => {
    test('point', async () => {
      //const s = read(L, '<http://www.opengis.net/def/crs/EPSG/0/4326> Point(33.95 -83.38)');
      const s = read(L, 'Point(33.95 -83.38)');
      expect(s).toBeInstanceOf(L.Marker);
      expect(s.getLatLng()).toEqual(L.latLng([-83.38, 33.95]));
    });
    test('line', async () => {
      const s = read(L, 'LINESTRING (30 10, 10 30, 40 40)');
      expect(s).toBeInstanceOf(L.Polyline);
      expect(s.getLatLngs().map(c => [c.lat, c.lng])).toEqual([[10, 30], [30, 10], [40, 40]]);
    });
    test('box', async () => {
      const s = read(L, 'POLYGON ((10 10, 10 40, 30 40, 30 10, 10 10))');
      //console.log(s.getLatLngs());
      expect(s).toBeInstanceOf(L.Rectangle);
      expect(s.getLatLngs()[0].map(c => [c.lat, c.lng])).toEqual([[10, 10], [40, 10], [40, 30], [10, 30]]);
    });
    test('polygon', async () => {
      const s = read(L, 'POLYGON ((30 10, 40 40, 20 40, 10 20, 30 10))');
      expect(s).toBeInstanceOf(L.Polygon);
      expect(s.getLatLngs()[0].map(c => [c.lat, c.lng])).toEqual([[10, 30], [40, 40], [40, 20], [20, 10]]);
    });
    test('circle', async () => {
      const s = read(L, 'CIRCLE ((111 64), 10000)');
      expect(s).toBeInstanceOf(L.Circle);
      expect(s.getLatLng()).toEqual(L.latLng([64, 111]));
      expect(s.getRadius()).toEqual(10000);
    });
  })

  test.describe('write', () => {
    test('point', async () => {
      //const s = read(L, '<http://www.opengis.net/def/crs/EPSG/0/4326> Point(33.95 -83.38)');
      const s = write(L.marker([-83.38, 33.95]));
      expect(s).toEqual('POINT (33.95 -83.38)');
    });
    test('line', async () => {
      const s = write(L.polyline([[10, 30], [30, 10], [40, 40]]));
      expect(s).toEqual('LINESTRING (30 10, 10 30, 40 40)');
    });
    test('box', async () => {
      const s = write(L.rectangle([[10, 10], [40, 10], [40, 30], [10, 30]]));
      expect(s).toEqual('POLYGON ((10 10, 10 40, 30 40, 30 10, 10 10))');
    });
    test('polygon', async () => {
      const s = write(L.polygon([[10, 30], [40, 40], [40, 20], [20, 10]]));
      expect(s).toEqual('POLYGON ((30 10, 40 40, 20 40, 10 20, 30 10))');
    });
    test('circle', async () => {
      const s = write(L.circle([64, 111], { radius: 10000 }));
      expect(s).toEqual('CIRCLE ((111 64), 10000)');
    });
  });
});