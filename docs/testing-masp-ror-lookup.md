# Testing MASP Profile Support and ROR Organisation Lookup

This guide covers manual testing of the MASP profile integration and the ROR organisation lookup feature on the `185-crate-o-masp-support` branch.

## Setup

### Prerequisites

- Node.js ≥ 18
- Chrome, Chromium, or Edge (required for the FileSystem API)

### Start the dev server

```bash
cd crate-o
npm install
npm run dev
```

Open **http://localhost:5173** (or the port shown in the terminal).

---

## Test 1 — Load a MASP profile and open a collection

1. Open the app in a Chromium-based browser.
2. Click **Open** and pick the `test-data/sydney/` folder from this repo.  
   The *Sydney Speaks* collection will load.
3. In the **Profile** dropdown, select **LDAC Collection** (or another MASP-backed profile such as *Schema.org*).
4. Verify:
   - The root `./` entity opens automatically.
   - The property list is driven by the MASP profile — you should see property groups / tabs rather than a flat alphabetical list.
   - The `funder` field shows the existing ROR-linked organisations (`https://ror.org/05mmh0f86`, `https://ror.org/019wvm592`).

---

## Test 2 — ROR organisation lookup (adding a new funder)

1. With the *Sydney Speaks* root entity open and the **LDAC Collection** profile selected:
2. Scroll to the **funder** property (usually in a *Funding / Admin* group).
3. Click the **+** button next to `funder`.
4. The type selector should default to — or include — **Organization**.  
   Confirm that **Text**, **Number**, and bare **Entity** are *not* the only options; **Organization** must be present.
5. With **Organization** selected, a search box driven by ROR should appear.
6. Type a partial name, e.g. `Australian Research Council`.
7. A dropdown of matching organisations from the ROR registry should appear.
8. Select one.

**Expected result:**

- The funder row gains a new clickable link badge showing the organisation's name (e.g. *Australian Research Council*).
- Clicking the link navigates to the Organisation entity in the editor.
- The Organisation entity has `@type: Organization`, a `name`, and ideally `url` populated from ROR data.
- The entity appears in the **Entities** sidebar list.

---

## Test 3 — Forward link persists after navigation

1. After adding a funder via ROR (Test 2 above):
2. Navigate away by clicking a different entity in the sidebar.
3. Navigate back to `./` (the root Dataset).
4. Confirm the funder link badge is still present and clickable.

---

## Test 4 — Schema.org profile ROR lookup

Repeat Tests 2–3 with the **Schema.org** profile selected instead of LDAC Collection.  
The funder, publisher, and other `Organization`-typed properties should all offer the ROR lookup.

---

## What to check if something looks wrong

| Symptom | Likely cause |
|---|---|
| Type dropdown shows only Text / Number / Entity | Profile definition not loading — check the browser console for errors from `EditorState.getDefinitions` |
| ROR search box does not appear after selecting Organization | Lookup module failed to initialise — check for network errors or a console error from `ror.js` |
| Organisation added but no link badge shown | Entity not being added to crate — check console for `addEntity` errors |
| Link badge shows `@id` URL instead of name | Organisation entity has no `name` property — the ROR result may not have been stored correctly |
| Link navigates to a blank entity | Entity was added but properties not populated — check `Property.vue` `add()` logic |

---

## Saving and verifying the output

1. Click **Save** (or Ctrl/Cmd+S) to write `ro-crate-metadata.json` back to the folder.
2. Open the saved file and verify:
   - The root entity's `funder` array contains `{"@id": "https://ror.org/..."}` entries.
   - Corresponding Organisation entities exist in `@graph` with `@type`, `name`, and `url`.
