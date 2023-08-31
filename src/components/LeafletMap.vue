<script setup>
import "leaflet/dist/leaflet.css";
import "leaflet-gesture-handling/dist/leaflet-gesture-handling.css";
import * as L from "leaflet";
import "leaflet.path.drag";
import "leaflet-editable";
import { GestureHandling } from "leaflet-gesture-handling";
import { reactive, computed, ref, onMounted, watch, onBeforeUnmount, nextTick } from "vue";

const mapRef = ref();
//const tooltipRef = ref();

const props = defineProps({
  modelValue: { type: Object },
  //controls: { type: [String, Array], default: ['point', 'line', 'box', 'circle', 'polygon'] },
  transformer: { type: Function },
  current: {}
});

const emit = defineEmits({
  'update:modelValue': null,
  'update:current': null
});

const allShapes = {
  point: {
    update(layer, data) { layer.setLatLng(data); },
    createFn: 'marker',
    drawFn: 'startMarker',
    tooltip: 'Click to place a point. Press Esc to cancel.'
  },
  line: {
    createFn: 'polyline',
    drawFn: 'startPolyline',
    tooltip: 'Click to start drawing a line, click on last point to finish a line. Press Esc to cancel.'
  },
  box: {
    createFn: 'rectangle',
    drawFn: 'startRectangle',
    tooltip: 'Click and drag to draw a box, release mouse to finish. Press Esc to cancel.'
  },
  circle: {
    createFn: 'circle',
    drawFn: 'startCircle',
    tooltip: 'Click and drag to draw a circle, release mouse to finish. Press Esc to cancel.'
  },
  polygon: {
    createFn: 'polygon',
    drawFn: 'startPolygon',
    tooltip: 'Click to start drawing a polygon, click the first point to close the polygon. Press Esc to cancel.'
  }
};

const transform = computed(() => props.transformer(L, props.modelValue));
const enabledShapes = computed(() => transform.value.shapes.
  filter(s => allShapes[s]).map(s => {
    allShapes[s].name = s;
    return allShapes[s];
  }));
// const fromModel = computed(() => props.transformer(L));
// const toModel = computed(() => props.transformer(L, props.modelValue));

function update(shapes) {
  emit('update:modelValue', transform.value.toEntity(shapes));
}

// function updateLayer(layer, data, options) {
//   return ({
//     box(bounds) { layer.setBounds(bounds); },
//     circle(latlng, { radius }) { layer.setLatLng(latlng); layer.setRadius(radius); },
//     line(latlngs) { layer.setLatLngs(latlngs); },
//     point(latlng) { layer.setLatLng(latlng); },
//     polygon(latlngs) { layer.setLatLngs(latlngs); }
//   })[layer.kind]?.(data, options);
// }
var map;
onMounted(async () => {
  console.log('map mounted');
  // wait so that leaflet div has a size because otherwise the tiles won't load
  await new Promise(r => setTimeout(r, 100));
  //setTimeout(initMap, 100);
  initMap();
});

onBeforeUnmount(() => {
  if (map) map.remove();
});

function initMap() {
  //console.log(mapRef.value);

  const layerById = {};
  L.Map.addInitHook("addHandler", "gestureHandling", GestureHandling);
  const featuresLayer = L.featureGroup();
  map = L.map(mapRef.value, {
    gestureHandling: true,
    editable: true,
    editOptions: {
      featuresLayer
    }
  });
  map.setView([-27, 140], 3);
  L.tileLayer('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
  }).addTo(map);
  L.control.scale().addTo(map);
  featuresLayer.addTo(map);
  initControls(map, featuresLayer);

  watch(props.modelValue, (val) => {
    //todo: compare new values to existing values, only update when there is difference
    console.log('shapes updated');

    featuresLayer.clearLayers();
    if (!val) return;
    for (const shape of transform.value.fromEntity()) {
      if (shape) {
        try {
          shape.addTo(featuresLayer);
        } catch (error) {
          console.log(error);
          console.log(shape);
        }
      }
    }
    console.log(featuresLayer.getLayers());
    const bounds = featuresLayer.getBounds();
    if (bounds.isValid()) map.flyToBounds(bounds, { maxZoom: 7 });
  }, { immediate: true });

}

function initControls(map, featuresLayer) {
  //const controls = typeof props.controls === 'string' ? props.controls.split(' ') : props.controls;
  var selectedShape;
  var newShape;
  var actionLink;
  var isModified = false;
  const tooltip = L.DomUtil.create('div', 'leaflet-draw-tooltip', map.getContainer());

  function deactivateAction() {
    if (actionLink) {
      L.DomUtil.removeClass(actionLink, 'active');
      actionLink = null;
    }
  }
  function moveTooltip(e) {
    tooltip.style.left = (e.containerPoint.x + 5) + 'px';
    tooltip.style.top = (e.containerPoint.y - tooltip.offsetHeight - 5) + 'px';
  }
  // show tooltip
  map.on('mousemove', moveTooltip);
  function startAction(link, tooltipText) {
    if (actionLink) L.DomUtil.removeClass(actionLink, 'active');
    tooltip.innerHTML = tooltipText;
    tooltip.style.display = 'block';
    actionLink = link;
    L.DomUtil.addClass(actionLink, 'active');
  }
  function stopAction() {
    tooltip.innerHTML = '';
    tooltip.style.display = 'none';
    //map.off('mousemove', moveTooltip);
    if (actionLink) L.DomUtil.removeClass(actionLink, 'active');
    actionLink = null;
  }

  L.Control.DrawControl = L.Control.extend({
    options: { position: 'topleft' },
    onAdd(map) {
      var container = L.DomUtil.create('div', 'leaflet-control-draw leaflet-bar leaflet-control');
      L.DomEvent.on(container, 'mousedown', L.DomEvent.stopPropagation);
      for (const shape of enabledShapes.value) {
        const fname = shape.drawFn;
        const link = L.DomUtil.create('a', 'leaflet-control-draw-' + shape.name, container);
        link.href = '#';
        link.title = 'Create a new ' + shape.name;
        L.DomEvent.on(link, 'click', ((e) => {
          L.DomEvent.stop(e);
          if (actionLink === link) {
            map.editTools.stopDrawing();
            stopAction();
          } else {
            map.editTools[fname](null, { kind: shape.name });
            startAction(link, shape.tooltip);
          }
        }), this);
      }
      return container;
    }
  });
  L.control.drawControl = function (opts) {
    return new L.Control.DrawControl(opts);
  };
  L.control.drawControl().addTo(map);

  L.Control.EditControl = L.Control.extend({
    options: { position: 'topleft' },
    onAdd(map) {
      const container = L.DomUtil.create('div', 'leaflet-control-edit leaflet-bar leaflet-control');
      L.DomEvent.on(container, 'mousedown', L.DomEvent.stopPropagation);
      const link = L.DomUtil.create('a', 'leaflet-control-edit-delete', container);
      link.href = '#';
      link.title = 'Delete a point or shape';
      L.DomEvent.on(link, 'click', ((e) => {
        L.DomEvent.stop(e);
        if (actionLink === link) {
          stopAction();
        } else {
          map.editTools.stopDrawing();
          selectedShape?.disableEdit();
          startAction(link, 'Click on a point or shape to delete. Press Esc to finish.');
        }
      }));
      return container;
    }
  });
  (new L.Control.EditControl()).addTo(map);

  // press esc key to cancel all ongoing action
  map.on('keydown', function (e) {
    console.log('keydown');
    if (e.originalEvent.keyCode === 27) { // 27 is escape key's keyCode
      map.editTools.stopDrawing();
      stopAction();
    }
  });
  //L.DomEvent.on(document.getElementsByClassName('leaflet-control-container')[0], 'mousedown', L.DomEvent.stopPropagation);

  map.on('click', function (e) {
    console.log('map click', e);
    selectedShape?.disableEdit();
  });
  map.on('editable:drawing:start', function (e) {
    console.log('editable:drawing:start', e.layer._leaflet_id);
    selectedShape?.disableEdit();
  });
  map.on('editable:drawing:end', function (e) {
    console.log('editable:drawing:end', e);
    stopAction();
    if (isModified) {
      setTimeout(() => {
        selectedShape = null;
        e.layer.disableEdit();
      }, 1);
    }
  });

  featuresLayer.on('click', function (e) {
    console.log('click', e);
    L.DomEvent.stop(e);
    const layer = e.layer;
    const isDeleting = actionLink && L.DomUtil.hasClass(actionLink, 'leaflet-control-edit-delete');
    console.log('isDeleting', isDeleting);
    if (isDeleting) {
      //if ((e.originalEvent.ctrlKey || e.originalEvent.metaKey) || isDeleting) {}
      //layer.editor.deleteShapeAt(e.latlng);
      featuresLayer.removeLayer(layer);
      update(featuresLayer.getLayers());
      map.getContainer().focus();
    } else {
      selectedShape?.disableEdit();
      selectedShape = e.layer;
      layer.enableEdit();
      //layer.dragging.enable();
      // const shapes = featuresLayer.getLayers();
      // for (let i = 0; i < shapes.length; ++i) {
      //   if (shapes[i] === layer) {
      //     return emit('update:current', i);
      //   }
      // }      
    }
  });

  map.on('editable:created', (e) => console.log('editable:created', e));
  map.on('editable:enable', function (e) {
    console.log('editable:enable', e.layer._leaflet_id);
    if (e.layer.setStyle) e.layer.setStyle({ color: 'DarkRed' });
    else if (e.layer._icon) e.layer._icon.style.filter = "hue-rotate(120deg)";
  });
  map.on('editable:disable', function (e) {
    console.log('editable:disable');
    if (e.layer.setStyle) e.layer.setStyle({ color: '#3388ff' });
    else if (e.layer._icon) e.layer._icon.style.filter = "";
    if (isModified) {
      console.log(featuresLayer.getLayers());
      update(featuresLayer.getLayers());
      isModified = false;
    }
    selectedShape = null;
  });

  map.on('editable:dragend editable:vertex:dragend editable:vertex:new editable:vertex:deleted editable:drawing:commit', (e) => {
    // console.log(e.type);
    // console.log(e.layer._leaflet_id);
    isModified = true;
  });

  // map.on('editable:drawing:click', (e) => console.log('editable:drawing:click', e));
  //map.on('editable:editing', (e) => console.log('editable:editing', e));
  // map.on('editable:edited', (e) => console.log('edited', e));
  // map.on('editable:shape:new', (e) => console.log('editable:shape:new', e));
  // map.on('editable:vertex:deleted', (e) => console.log('vertex:deleted', e));

  // map.on('editable:vertex:new', (e) => { console.log('vertex:new', e); console.log('vertex:new', e.editTools.drawing()); });
  // map.on('editable:vertex:dragend', (e) => console.log('vertex:dragend', e));
}

</script>

<template>
  <div ref="mapRef" class="flex-1" v-once></div>
</template>

<style>
.leaflet-control-draw a.leaflet-control-draw-point {
  background-position: -120px -1px;
}

.leaflet-control-draw a.leaflet-control-draw-line {
  background-position: 0 -1px;
}

.leaflet-control-draw a.leaflet-control-draw-box {
  background-position: -60px -1px;
}

.leaflet-control-draw a.leaflet-control-draw-circle {
  background-position: -90px -1px;
}

.leaflet-control-draw a.leaflet-control-draw-polygon {
  background-position: -29px -1px;
}

.leaflet-control-edit a.leaflet-control-edit-delete {
  background-position: -180px -1px;
}

.leaflet-control-draw a,
.leaflet-control-edit a {
  display: block;
  background-repeat: no-repeat;
  background-size: 300px 30px;
  background-clip: padding-box;
  background-image: linear-gradient(transparent, transparent), url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="600" height="60"%3E%3Cg style="fill:%23464646;fill-opacity:1"%3E%3Cg style="fill:%23464646;fill-opacity:1"%3E%3Cpath d="M18 36v6h6v-6h-6zm4 4h-2v-2h2v2zM36 18v6h6v-6h-6zm4 4h-2v-2h2v2z" style="fill:%23464646;fill-opacity:1"/%3E%3Cpath d="m23.142 39.145-2.285-2.29 16-15.998 2.285 2.285z" style="fill:%23464646;fill-opacity:1"/%3E%3C/g%3E%3Cpath d="m100 24.565-2.096 14.83L83.07 42 76 28.773 86.463 18ZM140 20h20v20h-20zM221 30c0 6.078-4.926 11-11 11s-11-4.922-11-11c0-6.074 4.926-11 11-11s11 4.926 11 11zM270 19c-4.971 0-9 4.029-9 9s5.001 12 9 14c4.001-2 9-9.029 9-14s-4.029-9-9-9zm0 12.5c-2.484 0-4.5-2.014-4.5-4.5 0-2.484 2.016-4.5 4.5-4.5 2.485 0 4.5 2.016 4.5 4.5 0 2.486-2.015 4.5-4.5 4.5z" style="fill:%23464646;fill-opacity:1"/%3E%3Cg id="a" style="fill:%23464646;fill-opacity:1"%3E%3Cpath d="M337 30.156v6.011c0 1.658-1.344 3-3 3h-10c-1.655 0-3-1.342-3-3v-10c0-1.657 1.345-3 3-3h6.345l3.19-3.17H324c-3.313 0-6 2.687-6 6v10c0 3.313 2.687 6 6 6h10c3.314 0 6-2.687 6-6v-8.809l-3 2.968" style="fill:%23464646;fill-opacity:1"/%3E%3Cpath d="m338.72 24.637-8.892 8.892H327V30.7l8.89-8.89z" style="fill:%23464646;fill-opacity:1"/%3E%3Cpath d="M338.697 17.826h4v4h-4z" style="fill:%23464646;fill-opacity:1" transform="rotate(-134.9900002 340.70299871 19.81699862)"/%3E%3C/g%3E%3Cg id="b" style="fill:%23464646;fill-opacity:1"%3E%3Cpath d="M381 42h18V24h-18v18zm14-16h2v14h-2V26zm-4 0h2v14h-2V26zm-4 0h2v14h-2V26zm-4 0h2v14h-2V26zM395 20v-4h-10v4h-6v2h22v-2h-6zm-2 0h-6v-2h6v2z" style="fill:%23464646;fill-opacity:1"/%3E%3C/g%3E%3C/g%3E%3Cg style="fill:%23bbb" transform="translate(120)"%3E%3Cuse xlink:href="%23a" width="100%25" height="100%25"/%3E%3Cuse xlink:href="%23b" width="100%25" height="100%25"/%3E%3C/g%3E%3Cpath d="M581.65725 30c0 6.078-4.926 11-11 11s-11-4.922-11-11c0-6.074 4.926-11 11-11s11 4.926 11 11z" style="fill:none;stroke:%23464646;stroke-width:2;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"/%3E%3C/svg%3E');
}

.leaflet-control-draw a.active,
.leaflet-control-edit a.active {
  background-color: #ff9090;
}

.leaflet-draw-tooltip {
  display: none;
  position: absolute;
  background: #333;
  color: white;
  opacity: 0.7;
  padding: 5px;
  border: 1px dashed #999;
  font-family: sans-serif;
  font-size: 1em;
  line-height: 1.5;
  z-index: 1000;
}
</style>