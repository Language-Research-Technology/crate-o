/// <reference types="Cypress" />

import CrateEditor from './CrateEditor.vue';
import base from 'ro-crate-editor-profiles/modes/base.json'
import schema from 'ro-crate-editor-profiles/modes/schema.json'
import language_collection from 'ro-crate-editor-profiles/modes/language-data-commons.json'


const MY_ORG = 'Australian National University';
const MY_ORG_ID = 'https://ror.org/019wvm592';
const ORG_NOT_IN_ROR = 'MY ORGANIZATION';

describe('<CrateEditor /> Lookups', () => {

    beforeEach(() => {
        cy.viewport(1024, 768);
    });

    //We could loop all modes, but we cannot because each profile might have a different UI
    for (let mode of [language_collection, schema]) {
        it.skip(`Finds an ROR using mode: ${mode.metadata.name}`, () => {
            // see: https://on.cypress.io/mounting-vue
            cy.mount(CrateEditor, {
                props: {
                    crate: {},
                    mode: mode,
                    entityId: './'
                },
                ref: 'editor'
            });
            cy.get('[id^=tab-Related]').click();
            cy.get('.el-form-item').find('button:first').contains('Organization').click();
            cy.get('.el-form-item > *').contains('Publisher').parent().siblings().find('.el-input__inner:first').type(MY_ORG);
            cy.get('.el-popper', {timeout: 10000}).find('li').should('include.text', MY_ORG);
            cy.get('.el-popper').find('li').contains(MY_ORG).click();
            cy.get('.el-form-item').find("button").contains(MY_ORG).click();
            cy.get('.el-link').find('span').contains('Root Dataset').click();
        });
    }

    // Skip because it was making me crazy
    it.skip(`Finds an ROR using mode: ${base.metadata.name}`, () => {
        // see: https://on.cypress.io/mounting-vue
        cy.mount(CrateEditor, {
            props: {
                crate: {},
                mode: base,
                entityId: './'
            },
            ref: 'editor'
        });
        cy.get('[id^=tab-Related]').click();
        cy.get('.el-form-item > *').contains('Publisher').parent().siblings().find('.el-input__inner:first').click();
        cy.get('.el-popper[aria-hidden=false]').find('.el-select-dropdown__item').contains('Organization').click({force: true});
        cy.get('.el-input__inner[placeholder="Select"]:first').type(`${MY_ORG}`);
        cy.get('.el-popper[aria-hidden=false]', {timeout: 10000}).find('li').should('include.text', MY_ORG);
        cy.get('.el-popper').find('li').contains(MY_ORG).click();
        cy.get('.el-form-item').find("button").contains(MY_ORG).click();
        cy.get('.el-input__inner:first', {timeout: 10000}).should('contain.value', MY_ORG_ID);
        cy.get('.el-link').find('span').contains('Root Dataset').click();
    });

    it.skip('Can enter an organization by clicking Create Button', () => {
        // see: https://on.cypress.io/mounting-vue
        cy.mount(CrateEditor, {
            props: {
                crate: {},
                mode: language_collection,
                entityId: './'
            },
            ref: 'editor'
        });
        cy.get('[id^=tab-Related]').click();
        cy.get('.el-form-item').find('button').contains('Organization').click();
        cy.get('.el-form-item > *').contains('Publisher').parent().siblings().find('.el-input__inner:first').type(ORG_NOT_IN_ROR);
        cy.get('.add-new-entity').click();
        cy.get('.el-form-item').find('.el-input:first').type('{selectall}').type('ORG_ID{enter}').invoke('blur');
        cy.get('textarea:first').type(`{selectall}${ORG_NOT_IN_ROR.toLowerCase()}`);
        cy.get('.el-link').find('span').contains('Root Dataset').click()
    });

});