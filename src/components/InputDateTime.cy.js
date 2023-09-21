/// <reference types="Cypress" />

import InputDateTime from './InputDateTime.vue';
import software from 'ro-crate-editor-profiles/profiles/software-profile.json'
import language_collection from 'ro-crate-editor-profiles/profiles/language-data-commons-collection-profile.json'

describe('<InputDateTime />', async () => {

    beforeEach(() => {
    });

    it('handles ISO dates', () => {
        let date = '2001-01-19T13:00:00.000Z'
        // see: https://on.cypress.io/mounting-vue
        cy.mount(InputDateTime, {
            props: {
                modelValue: date,
                type: 'datetime'
            }
        });
        cy.get('.el-input__inner').should('have.value', date);
    });

    it('handles dates', () => {
        let date = '2023'
        // see: https://on.cypress.io/mounting-vue
        cy.mount(InputDateTime, {
            props: {
                modelValue: date,
                type: 'date'
            }
        });
        cy.get('.el-input__inner').should('have.value', date);
    });

    it('handles time', () => {
        let date = '12:00:00'
        // see: https://on.cypress.io/mounting-vue
        cy.mount(InputDateTime, {
            props: {
                modelValue: date,
                type: 'time'
            }
        });
        cy.get('.el-input__inner').should('have.value', date);
    });

    it('should not error with correct format', () => {
        let date = '2023/01/01';
        // see: https://on.cypress.io/mounting-vue
        cy.mount(InputDateTime, {
            props: {
                modelValue: date,
                type: 'datetime'
            }
        });
        cy.get('.el-input__inner').should('have.value', date)
        cy.get('.flex').children().should('not.have.class', 'text-xs text-red-700')
    });

    it('should error with wrong format', () => {
        let date = '2023/02/30'; // 30 Feb!
        // see: https://on.cypress.io/mounting-vue
        cy.mount(InputDateTime, {
            props: {
                modelValue: date,
                type: 'datetime'
            }
        });
        cy.get('.el-input__inner').should('have.value', date);
        cy.get('.el-input-group').siblings().should('have.class', 'text-xs text-red-700')
        cy.get('.el-input-group').siblings().should('contain.text', 'ISO');
    });

    it('should not error with correct format', () => {
        let date = '2023';
        // see: https://on.cypress.io/mounting-vue
        cy.mount(InputDateTime, {
            props: {
                modelValue: date,
                type: 'datetime'
            }
        });
        cy.get('.el-input__inner').should('have.value', date)
        cy.get('.flex').children().should('not.have.class', 'text-xs text-red-700')
    });
});