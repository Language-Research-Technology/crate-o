/// <reference types="Cypress" />

import * as L from "leaflet";
import { _private } from './geo_wkt';
const { parsePoints, polygonToBox, read, writer } = _private;
const write = writer(L);

// test data in default WGS84 geodetic longitude-latitude spatial reference system
describe('parsePoints', () => {
  it('one point', async () => {
    const s = parsePoints('(30 10)');
    expect(s).to.eql([[10, 30]]);
  });
  it('circle', async () => {
    const s = parsePoints('((111 64), 10000)');
    expect(s).to.eql([[[64, 111]], 10000]);
  });

  it('multi points', async () => {
    var s = parsePoints('(30 10, 10 30)');
    expect(s).to.eql([[10, 30], [30, 10]]);
    s = parsePoints('(30 10, 10 30, 40 50)');
    expect(s).to.eql([[10, 30], [30, 10], [50, 40]]);
  });

  it('one level nested multi points', async () => {
    var s = parsePoints('((30 10, 40 40, 20 40, 10 20, 30 10))');
    expect(s).to.eql([[[10, 30], [40, 40], [40, 20], [20, 10], [10, 30]]]);
    s = parsePoints('((30 10, 40 40, 20 40, 10 20, 30 10), (20 30, 35 35, 30 20, 20 30))');
    expect(s).to.eql([[[10, 30], [40, 40], [40, 20], [20, 10], [10, 30]],
    [[30, 20], [35, 35], [20, 30], [30, 20]]]);
  });

  it('two level nested multi points', async () => {
    var s = parsePoints('(((30 10, 40 40, 20 40, 10 20, 30 10)),((15 5, 40 10, 10 20, 15 5)))');
    expect(s).to.eql([[[[10, 30], [40, 40], [40, 20], [20, 10], [10, 30]]], [[[5, 15], [10, 40], [20, 10], [5, 15]]]]);
    s = parsePoints('(((40 40, 20 45, 45 30, 40 40)), ((20 35, 10 30, 10 10, 30 5, 45 20, 20 35), (30 20, 20 15, 20 25, 30 20)))');
    expect(s).to.eql([[[[40, 40], [45, 20], [30, 45], [40, 40]]],
    [[[35, 20], [30, 10], [10, 10], [5, 30], [20, 45], [35, 20]], [[20, 30], [15, 20], [25, 20], [20, 30]]]]);
  });
});

describe('polygonToBox', () => {
  it('box', async () => {
    //POLYGON ((32.16764634362565 40, 10 40, 10 25.48295117535531, 32.16796875000001 25.48295117535531, 32.16764634362565 40))
    const p = polygonToBox([[[32.16764634362565,40],[10,40],[10,25.48295117535531],[32.16764634362565,25.48295117535531],[32.16764634362565,40]]]);
    //const p = polygonToBox([[[32,40],[10,40],[10,25],[32,25],[32,40]]]);
    //console.log(p);
    expect(p).to.eql([ [ 10, 25.48295117535531 ], [ 32.16764634362565, 40 ] ]);
  });

});

describe('read', () => {
  it('point', async () => {
    //const s = read(L, '<http://www.opengis.net/def/crs/EPSG/0/4326> Point(33.95 -83.38)');
    const s = read(L, 'Point(33.95 -83.38)');
    expect(s).instanceOf(L.Marker);
    assert(s.getLatLng().equals(L.latLng([-83.38, 33.95])));
  });
  it('line', async () => {
    const s = read(L, 'LINESTRING (30 10, 10 30, 40 40)');
    expect(s).instanceOf(L.Polyline);
    expect(s.getLatLngs().map(c => [c.lat, c.lng])).to.eql([[10, 30], [30, 10], [40, 40]]);
  });
  it('box', async () => {
    const s = read(L, 'POLYGON ((10 10, 10 40, 30 40, 30 10, 10 10))');
    //console.log(s.getLatLngs());
    expect(s).instanceOf(L.Rectangle);
    expect(s.getLatLngs()[0].map(c => [c.lat, c.lng])).to.eql([[10, 10], [40, 10], [40, 30], [10, 30]]);
  });
  it('polygon', async () => {
    const s = read(L, 'POLYGON ((30 10, 40 40, 20 40, 10 20, 30 10))');
    expect(s).instanceOf(L.Polygon);
    expect(s.getLatLngs()[0].map(c => [c.lat, c.lng])).to.eql([[10, 30], [40, 40], [40, 20], [20, 10]]);
  });
  it('circle', async () => {
    const s = read(L, 'CIRCLE ((111 64), 10000)');
    expect(s).instanceOf(L.Circle);
    assert(s.getLatLng().equals(L.latLng([64, 111])));
    expect(s.getRadius()).to.equal(10000);
  });
})

describe('write', () => {
  it('point', async () => {
    //const s = read(L, '<http://www.opengis.net/def/crs/EPSG/0/4326> Point(33.95 -83.38)');
    const s = write(L.marker([-83.38, 33.95]));
    expect(s).to.equal('POINT (33.95 -83.38)');
  });
  it('line', async () => {
    const s = write(L.polyline([[10, 30], [30, 10], [40, 40]]));
    expect(s).to.equal('LINESTRING (30 10, 10 30, 40 40)');
  });
  it('box', async () => {
    const s = write(L.rectangle([[10, 10], [40, 10], [40, 30], [10, 30]]));
    expect(s).to.equal('POLYGON ((10 10, 10 40, 30 40, 30 10, 10 10))');
  });
  it('polygon', async () => {
    const s = write(L.polygon([[10, 30], [40, 40], [40, 20], [20, 10]]));
    expect(s).to.equal('POLYGON ((30 10, 40 40, 20 40, 10 20, 30 10))');
  });
  it('circle', async () => {
    const s = write(L.circle([64, 111], {radius: 10000}));
    expect(s).to.equal('CIRCLE ((111 64), 10000)');
  });
})
