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
    npm install https://github.com/Language-Research-Technology/ro-crate-editor-profiles.git

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
```Vue
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
```Vue
<script setup>
import profile from 'ro-crate-editor-profiles/profiles/language-data-commons-collection-profile.json'
import crate from "../crate.json"

import { CrateEditor } from 'crate-o'
import 'crate-o/css'
</script>

<template>
  <crate-editor :crate="crate" :profile="profile"></crate-editor>
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
```Vue
<script setup>
import profile from 'ro-crate-editor-profiles/profiles/language-data-commons-collection-profile.json'
import crate from "../crate.json"

</script>

<template>
  <crate-editor :crate="crate" :profile="profile"></crate-editor>
</template>
```


Test the project by running `npm run dev`.

## Working with vue-router
The CrateEditor component can show an entity specified in the URL query parameter and set the correct URL when navigating to the a different entity. See how it works in the `src/app` as an example.
To use the simple default route handling import the `handleRoute` from `DefaultRouteHandler`.

`src/views/HomeView.vue`:
```Vue
<script setup>
import profile from 'ro-crate-editor-profiles/profiles/language-data-commons-collection-profile.json'
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
  <crate-editor :crate="crate" :profile="profile" 
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
