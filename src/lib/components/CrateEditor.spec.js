import { expect, test } from '@playwright/experimental-ct-vue';
import CrateEditor from './CrateEditor.vue';
import language_collection from 'ro-crate-modes/modes/language-data-commons-collection.json' with { type: 'json' };
import { ref } from 'vue';

const editorOpt = {
  props: {
    crate: {},
    mode: language_collection,
    entityId: './',
  }
};
//TODO: test breadcrumb
test.describe('CrateEditor', { tag: '@component' }, () => {
  //test.use({ viewport: { width: 1024, height: 768 } });
  test('create a new organization', async ({mount}) => {
    const editor = await mount(CrateEditor, editorOpt);

    await editor.getByRole('tab', { name: 'related' }).click();
    await editor.getByLabel('publisher').getByRole('button', { name: 'Organization' }).click();
    //await page.getByRole('combobox', { name: 'publisher' }).click();
    await editor.getByRole('combobox', { name: 'publisher' }).fill('Ldaca');
    //const r = await editor.evaluate(() => { return componentRef.value; });
    await editor.getByRole('button', { name: 'Create new Organization:' }).click();
    await expect(editor.getByRole('textbox', { name: 'name' })).toHaveValue('Ldaca');
    //await page.getByText('Related People, Orgs & Works').click();
    // cy.get('.el-form-item').find('button').contains('Organization').click();
    // cy.get('button').contains('Create new Organization').click();
    // cy.get('.el-form-item').find('.el-input:first').type('{selectall}').type('ORG_ID{enter}').invoke('blur');
  });

  // it('Can click to all entities and switch tabs', () => {
  //   // see: https://on.cypress.io/mounting-vue
  //   cy.mount(CrateEditor, {
  //     props: {
  //       crate: {},
  //       profile: language_collection,
  //       entityId: './',
  //     },
  //     ref: 'editor',
  //   });
  //   cy.get('.el-tabs__item').contains('All Entities').click();
  //   cy.get('button').contains('Dataset').click();
  //   cy.get('#tab-Others').click();
  //   cy.get('.el-form-item').find('button').contains('Boolean').click();
  //   cy.get('.el-checkbox__original').check();
  // });

  // it('Can create new unliked entity', () => {
  //   // see: https://on.cypress.io/mounting-vue
  //   cy.mount(CrateEditor, {
  //     props: {
  //       crate: {},
  //       profile: language_collection,
  //       entityId: './',
  //     },
  //     ref: 'editor',
  //   });
  //   cy.get('.el-select-v2').contains('Create New Entity').click();
  //   let selector;
  //   cy.get('.el-select-dropdown > *')
  //     .get('li:first')
  //     .then((li) => {
  //       selector = li.text();
  //     })
  //     .click();
  //   cy.log(selector);
  //   cy.get('.el-input__inner:first')
  //     .invoke('val')
  //     .then((val) => {
  //       cy.log(`value found: ${val}`);
  //       assert(val === `#${selector}-1`);
  //     });
  // });

  // it('cannot delete Version type of a required type', () => {
  //     // see: https://on.cypress.io/mounting-vue
  //     cy.mount(CrateEditor, {
  //         props: {
  //             crate: {},
  //             profile: software,
  //             entityId: './'
  //         },
  //         ref: 'editor'
  //     });
  //     cy.get('#tab-Others').click();
  //     cy.get('.el-form-item > *').contains('Version').parent().siblings().find('.el-input__inner:first').click();
  //     cy.get('.el-select-dropdown__item').contains('Number').click();
  //     cy.get('.el-form-item > *').contains('Version').parent().siblings().find(':button').should('be.disabled')
  // });
});
