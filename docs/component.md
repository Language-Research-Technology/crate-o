# Using Crate-O as a component in a VueJS application

## Quick start guide
This simple guide provides an example on how to start with a new Vue Single Page Application that will use the Crate-O component. Up-to-date Node.js is required to create and build a VueJS project. 
Start with the following command on a directory where you intend to create your project directory and follow the prompt.

    npm create vue@latest

Choose **Yes** when asked to install a router if you need one. Otherwise, ignore anything related to the router (including the project structure and file names) from the rest of this guide. If you are unsure about the other options, simply choose No by hitting enter for now. Once the project is created, install dependencies and test the dev server:

    cd <project-name>
    npm install
    npm run dev

You should now have the Vue project running. Press `q` to exit the dev server.
Install Crate-O and some example mode files as a dependency.

    npm install crate-o
    // example mode files
    npm install https://github.com/Language-Research-Technology/ro-crate-modes.git

Create an example crate file `src/crate.json`:
```json
    {
        "@context": [
            "https://w3id.org/ro/crate/1.1/context",
            {
                "@vocab": "http://schema.org/"
            }
        ],
        "@graph": [
            {
                "@id": "ro-crate-metadata.json",
                "@type": "CreativeWork",
                "identifier": "ro-crate-metadata.json",
                "about": {
                    "@id": "./"
                }
            },
            {
                "@id": "./",
                "@type": "Dataset",
                "author": [{ "@id": "#test" }]
            },
            {
                "@id": "#test",
                "@type": "Person",
                "name": "Test"
            }
        ]
    }
```

To start with a simple example, simplify the `App.vue` file:

`src/App.vue`:
```vue
    <script setup>
      import { RouterLink, RouterView } from 'vue-router'
    </script>

    <template>
      <RouterView />
    </template>
```

Continue to edit other files accordingly. Either use local import as needed or add the component globally.

* **Using crate-editor with local import**

`src/main.js`:
```js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
const app = createApp(App)
app.use(router)
app.mount('#app')
```

`src/views/HomeView.vue`:
```vue
<script setup>
import mode from 'ro-crate-modes/modes/default.json'
import crate from "../crate.json"

import { CrateEditor } from 'crate-o'
import 'crate-o/css'
</script>

<template>
  <crate-editor :crate="crate" :mode="mode"></crate-editor>
</template>
```


* **Using crate-editor with global import**

`src/main.js`:
```js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { CrateEditor } from 'crate-o'
import 'crate-o/css';
const app = createApp(App)
app.use(router)
app.use(CrateEditor)
app.mount('#app')
```

`src/views/HomeView.vue`:
```vue
<script setup>
import mode from 'ro-crate-modes/modes/default.json'
import crate from "../crate.json"

</script>

<template>
  <crate-editor :crate="crate" :mode="mode"></crate-editor>
</template>
```


Test the project by running `npm run dev`.


## Working with vue-router
The CrateEditor component can show an entity specified in the URL query parameter and set the correct URL when navigating to the a different entity. See how it works in the `src/app` as an example.
To use the simple default route handling, import the `handleRoute` function from `DefaultRouteHandler`.
For more details, refer to the source code of the reference Vue app at `src/app`. For the example above, make the following changes:

`src/views/HomeView.vue`:
```vue
<script setup>
import mode from 'ro-crate-modes/modes/default.json'
import crate from "../crate.json"

import { CrateEditor } from 'crate-o'
import 'crate-o/css'

import { reactive } from 'vue';
import { handleRoute } from 'crate-o/DefaultRouteHandler'

const navigate = handleRoute(entityId => {
  data.entityId = entityId;
});

const data = reactive({
  entityId: ''
});

</script>

<template>
  <crate-editor :crate="crate" :mode="mode" 
    :entityId="data.entityId" @update:entityId="id => navigate(id)">
  </crate-editor>
</template>
```

The example only works with web hash history at the momment, so edit `src/router/index.js` and use `createWebHashHistory`:

```js 
import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [...]
```

## Interacting with the CrateEditor component
The CrateEditor component does not implement the Vue two-way binding through v-model and modelValue. Instead, it implements the one-way binding of attribute/prop and update event. The Ro-Crate data is passed as a plain object (in the format of JSON-LD) as the `crate` attribute/prop. If the object passed to `crate` is reactive, any changes to the original object will update the internal data in the CrateEditor. Note that the update is done by by re-parsing the whole object, so depending on the size of the data, frequent updates may cause a performance issue.
To efficiently read and manipulate the currently loaded crate from outside of the component, use the arguments passed by the `@ready` event. For example:

```vue
<script setup>
...
let editor;
function ready(crate, refresh) {
  editor = {crate, refresh}
}

// function that modify the data in the editor
function doSomething() {
  editor.crate.setProperty('#test', 'name', 'foo');
  editor.refresh(); // manually force to re-render the component if required
}

// function to get the data as plain object
function save() {
  var data = editor.crate.toJSON();
  
  // save the data somewhere..
}
</script>

<template>
  <crate-editor :crate="crate" :mode="mode" @ready="ready"></crate-editor>
</template>
```

The `crate` argument an ROCrate instance, documented at https://language-research-technology.github.io/ro-crate-js

## Component API

### Attributes
* **crate** : `object` A plain object conforming to valid JSON-LD structure and Research Object Crate (RO-Crate) specification. Default to `{}`.
* **mode** : `object` A plain object containing the crate-o Mode. A Mode specifies how the editor fields are structured, validated, displayed, and iteracted with. Default to `{ classes: {} }`.
* **entity-id** : `string` The identifier of the RO-Crate entity that is currently active or displayed in the editor.
* **property-id** : `string` The identifier of the RO-Crate entity's property that wants to be displayed in the editor .(applicable if property grouping is enabled)
* **load-file** : `function` An async function to retrieve the file information and content given the relative path of the file.

### Events
* **@update:entity-id** : `function` This event triggers when the active entity displayed in the editor is changed internally (eg when clicking the links). The first argument is the new entity id `string`.
* **@ready** : `function` This event triggers when input data has been completely parsed and the internal data structure has been constructed. It will receive two arguments:
  * roc `ROCrate` The first argument is the internal data structure which is an ROCrate instance. (see https://github.com/Language-Research-Technology/ro-crate-js)
  * refresh `function` The second argument is a function to manually re-render the component.
<!--
* **@change** : `function` This event triggers for any changes to the crate data made in the editor. Only the value or part that was changed is passed to the argument. The first argument is an array conforming to JSON patch format. [not implemented yet]
-->
### Exposes
* **rootDatasetId** : `string` A getter that returns the id of the root dataset.
* **crate** : `string` A getter that returns the RO-Crate data in plain object ready to be serialized.
* **refresh** : `function` A method to force to re-render the UI after making internal changes directly.
* **setProperty** : `function` A method to manually change the editor's internal data (and refresh the display) without having to re-parse the whole crate data (which will happen if input crate attribute is changed).