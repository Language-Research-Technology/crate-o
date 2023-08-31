/// <reference types="Cypress" />

import SpreadSheet from './SpreadSheet.vue';

const spreadsheetFile = './test-data/spreadsheet/additional-ro-crate-metadata.xlsx';
let excelBuffer;
import * as toArrayBuffer from 'to-arraybuffer';

describe('<SpreadSheet />', async () => {

    beforeEach(() => {
        cy.viewport(1024, 768);
        cy.readFile(spreadsheetFile, null, {log: true}).then((file) => {
            expect(Cypress.Buffer.isBuffer(file)).to.be.true;
            excelBuffer = toArrayBuffer(file);
            cy.log('converted to array buffer');
        });
    });

    it(`loads a spreadsheet into an ro-crate`, () => {
        // see: https://on.cypress.io/mounting-vue
        cy.mount(SpreadSheet, {
            props: {
                buffer: excelBuffer,
                dialogVisible: false
            }
        });
        cy.get('.el-dialog__body').should('not.contain.text', 'Error');
        cy.get('button').contains('Confirm').click();
    });

});