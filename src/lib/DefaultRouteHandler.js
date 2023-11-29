import {useRoute, useRouter, onBeforeRouteUpdate } from 'vue-router';
//const {useRoute, useRouter, onBeforeRouteUpdate } = await import('vue-router');

export function handleRoute(onUpdate) {
  const $router = useRouter();
  const $route = useRoute();
  var pushPromise;
  
  onBeforeRouteUpdate((to, from) => {
    const id = decodeURIComponent([].concat(to.query?.id)[0]  || '');
    const prop = decodeURIComponent([].concat(to.query?.prop)[0] || '');
    //console.log('onBeforeRouteUpdate', id, prop)
    onUpdate(id, prop);
  });

  return function navigate(entityId, propertyId) {
    //console.log('navigate', entityId, propertyId);
    //let r = (Math.random() + 1).toString(36).substring(7);
    const param = { };
    if (entityId) {
      param.query = { id: encodeURIComponent(entityId) };
      if (propertyId) {
        param.query.prop = encodeURIComponent(propertyId);
      }
    }
    //console.log($route.query);
    if ($route.query?.id === param.query?.id && $route.query?.prop === param.query?.prop) {
      onUpdate(entityId, propertyId);
    }
    const p = $router.push(param);
    if (pushPromise) pushPromise.then(p);
    else pushPromise = p;
    return pushPromise;
  }
  
}
