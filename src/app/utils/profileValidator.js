import schema from "ro-crate-modes/src/ro-crate-editor-profile-schema.json";

import Ajv from 'ajv/dist/2019';

export class Validator {
    errors = [];
    profile = {};

    constructor() {

    }

    loadAndCheck(content) {
        this.errors = [];
        try {
            this.profile = JSON.parse(content);
            this.check();
        } catch (e) {
            this.errors.push(e);
        }
    }

    check() {
        this.ajv = new Ajv({allErrors: true});
        const validate = this.ajv.compile(schema);
        const valid = validate(this.profile);
        if (!valid) {
            this.errors = validate.errors;
        }
    }
}