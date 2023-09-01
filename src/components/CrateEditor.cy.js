/// <reference types="Cypress" />

import CrateEditor from './CrateEditor.vue';
import language from "@/profiles/text-commons-collection-profile.json";
import base from "@/profiles/base-profile.json";
import schema from "@/profiles/schema.json";

const MY_ORG = 'Australian National University';
const MY_ORG_ID = 'https://ror.org/019wvm592';
const ORG_NOT_IN_ROR = 'MY ORGANIZATION';


describe('<CrateEditor />', async () => {

    beforeEach(() => {
        cy.viewport(1024, 768);
    });

    //We could loop all profiles, but we cannot because each profile might have a different UI
    for (let profile of [language, schema]) {
        it(`Finds an ROR using profile: ${profile.metadata.name}`, () => {
            // see: https://on.cypress.io/mounting-vue
            cy.mount(CrateEditor, {
                props: {
                    crate: {},
                    profile: profile,
                    entityId: './'
                },
                ref: 'editor'
            });
            cy.get('#tab-About').click();
            cy.get('#tab-Related\\ items').click();
            cy.get('.el-form-item').find('button').contains('Organization').click();
            cy.get('.el-input').type(MY_ORG);
            cy.get('.el-popper', {timeout: 10000}).find('li').should('include.text', MY_ORG);
            cy.get('.el-popper').find('li').contains(MY_ORG).click();
            cy.get('.el-form-item').find("button").contains(MY_ORG).click();
            cy.get('.el-link').find('span').contains('Root Dataset').click();
            cy.wait(500);
        });
    }

    it(`Finds an ROR using profile: ${base.metadata.name}`, () => {
        // see: https://on.cypress.io/mounting-vue
        cy.mount(CrateEditor, {
            props: {
                crate: {},
                profile: base,
                entityId: './'
            },
            ref: 'editor'
        });
        cy.get('#tab-About').click();
        cy.get('#tab-Related\\ items').click();
        cy.get('.el-form-item:first').find('.el-input:first').click();
        cy.get('.el-popper').find('li:first').contains('Organization').click();
        cy.get('.el-input__inner[placeholder="Select"]:first').click().type(`${MY_ORG}`);
        cy.get('.el-popper', {timeout: 10000}).find('li').should('include.text', MY_ORG);
        cy.get('.el-popper').find('li').contains(MY_ORG).click();
        cy.get('.el-form-item').find("button").contains(MY_ORG).click();
        cy.get('.el-input__inner:first', {timeout: 10000}).should('contain.value', MY_ORG_ID);
        cy.get('.el-link').find('span').contains('Root Dataset').click();
        cy.wait(500);
    });


    it('Can enter an organization by clicking Create Button', () => {
        // see: https://on.cypress.io/mounting-vue
        cy.mount(CrateEditor, {
            props: {
                crate: {},
                profile: language,
                entityId: './'
            },
            ref: 'editor'
        });
        cy.get('#tab-About').click();
        cy.get('#tab-Related\\ items').click();
        cy.get('.el-form-item').find('button').contains('Organization').click();
        cy.get('.el-input').type(`${ORG_NOT_IN_ROR}`);
        cy.get('.add-new-entity').click();
        cy.get('.el-form-item').find('.el-input:first').type('{selectall}').type('ORG_ID{enter}').invoke('blur');
        cy.get('textarea:first').type(`{selectall}${ORG_NOT_IN_ROR.toLowerCase()}`);
        cy.get('.el-link').find('span').contains('Root Dataset').click()
    });

    it('Can enter an organization', () => {
        // see: https://on.cypress.io/mounting-vue
        cy.mount(CrateEditor, {
            props: {
                crate: {},
                profile: language,
                entityId: './'
            },
            ref: 'editor'
        });
        cy.get('#tab-About').click();
        cy.get('#tab-Related\\ items').click();
        cy.get('.el-form-item').find('button').contains('Organization').click();
        cy.get('button').contains('Create new Organization').click();
        cy.get('.el-form-item').find('.el-input:first').type('{selectall}').type('ORG_ID{enter}').invoke('blur');
    });

    it('Can click to all entities and switch tabs', () => {
        // see: https://on.cypress.io/mounting-vue
        cy.mount(CrateEditor, {
            props: {
                crate: {},
                profile: language,
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

});