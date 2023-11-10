import {useRouter, onBeforeRouteUpdate, } from 'vue-router';


export function handleRoute(onUpdate) {
  const $router = useRouter();
  
  onBeforeRouteUpdate((to, from) => {
    const id = decodeURIComponent([].concat(to.query?.id)[0]);
    const prop = decodeURIComponent([].concat(to.query?.prop)[0]);
    if (id) {
      onUpdate(id, prop);
    }
  });

  return function navigate(entityId, propertyId) {
    const param = {};
    if (entityId) {
      param.query = { id: encodeURIComponent(entityId) };
      if (propertyId) {
        param.query.prop = encodeURIComponent(propertyId);
      }
    }
    $router.push(param);
  }
  
}
