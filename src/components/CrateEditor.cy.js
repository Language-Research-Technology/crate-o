/// <reference types="Cypress" />

import CrateEditor from './CrateEditor.vue';
import software from 'ro-crate-editor-profiles/profiles/software-profile.json'
import language_collection from 'ro-crate-editor-profiles/profiles/language-data-commons-collection-profile.json'

describe('<CrateEditor />', async () => {

    beforeEach(() => {
        cy.viewport(1024, 768);
    });

    it('Can enter an organization', () => {
        // see: https://on.cypress.io/mounting-vue
        cy.mount(CrateEditor, {
            props: {
                crate: {},
                profile: language_collection,
                entityId: './'
            },
            ref: 'editor'
        });
        cy.get('#tab-About').click();
        cy.get('[id^=tab-Related]').click();
        cy.get('.el-form-item').find('button').contains('Organization').click();
        cy.get('button').contains('Create new Organization').click();
        cy.get('.el-form-item').find('.el-input:first').type('{selectall}').type('ORG_ID{enter}').invoke('blur');
    });

    it('Can click to all entities and switch tabs', () => {
        // see: https://on.cypress.io/mounting-vue
        cy.mount(CrateEditor, {
            props: {
                crate: {},
                profile: language_collection,
                entityId: './'
            },
            ref: 'editor'
        });
        cy.get('.el-tabs__item').contains('All Entities').click();
        cy.get('button').contains('Dataset').click();
        cy.get('#tab-Others').click();
        cy.get('.el-form-item').find('button').contains('Boolean').click();
        cy.get('.el-checkbox__original').check();
    });

    it('Can create new unliked entity', () => {
        // see: https://on.cypress.io/mounting-vue
        cy.mount(CrateEditor, {
            props: {
                crate: {},
                profile: language_collection,
                entityId: './'
            },
            ref: 'editor'
        });
        cy.get('.el-select-v2').contains('Create New Entity').click();
        let selector;
        cy.get('.el-select-dropdown > *').get('li:first').then((li) => {
            selector = li.text();
        }).click();
        cy.log(selector);
        cy.get('.el-input__inner:first').invoke('val').then((val) => {
            cy.log(`value found: ${val}`)
            assert(val === `#${selector}-1`)
        });
    });

    it('cannot delete Version type of a required type', () => {
        // see: https://on.cypress.io/mounting-vue
        cy.mount(CrateEditor, {
            props: {
                crate: {},
                profile: software,
                entityId: './'
            },
            ref: 'editor'
        });
        cy.get('#tab-Others').click();
        cy.get('.el-form-item > *').contains('Version').parent().siblings().find('.el-input__inner:first').click();
        cy.get('.el-select-dropdown__item').contains('Number').click();
        cy.get('.el-form-item > *').contains('Version').parent().siblings().find(':button').should('be.disabled')
    });

});