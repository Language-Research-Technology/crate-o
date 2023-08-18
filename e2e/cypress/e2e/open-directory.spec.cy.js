describe('open directory spec', () => {
  it('successfully loads', () => {
    cy.visit('/');
    cy.contains('Crate-O')
    cy.contains("File").click();
    cy.contains('Open Directory ').click();
  })
});