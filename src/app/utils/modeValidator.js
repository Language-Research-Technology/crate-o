import schema from "ro-crate-editor-profiles/src/ro-crate-editor-profile-schema.json";

import Ajv from 'ajv/dist/2019';

export class Validator {
    errors = [];
    mode = {};

    constructor() {

    }

    loadAndCheck(content) {
        this.errors = [];
        try {
            this.mode = JSON.parse(content);
            this.check();
        } catch (e) {
            this.errors.push(e);
        }
    }

    check() {
        this.ajv = new Ajv({allErrors: true});
        const validate = this.ajv.compile(schema);
        const valid = validate(this.mode);
        if (!valid) {
            this.errors = validate.errors;
        }
    }
}