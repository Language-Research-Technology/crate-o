# Crate-O Developer Documentation

## [Crate-O as a component](./component.md)

## Basic Installation

To preview a local host version of Crate-O do the following:

npm install .

run npm dev

Open localhost URL in a compatible browser.

## Crate-O Release Process

To merge a branch to main and release a Crate-O update:
- Create a pull request on GitHub as normal, and assign someone as reviewer and assignee
- On the ticket, reviewer selects the __Files Changed__ tab to review the changes in the pull request. In the _package.json_ file, if the _version_ hasn't been updated, add a comment to the ticket for the creator to push this change:
<br>"Please update the version number in the package.json file. Increment last decimal by one, e.g. v0.3.13 -> v0.3.14"
- Creator edits the version number on the branch and pushes change to the ticket
- If all other updates are fine, reviewer approves the merge.