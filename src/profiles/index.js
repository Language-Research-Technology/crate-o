/**
 * The profiles in this directory are copied from
 * https://github.com/Language-Research-Technology/language-data-commons-vocabs/blob/master/profiles
 */

import base from 'ro-crate-editor-profiles/profiles/base-profile.json'
import schema from 'ro-crate-editor-profiles/profiles/schema.json'
import software from 'ro-crate-editor-profiles/profiles/software-profile.json'
import language_collection from 'ro-crate-editor-profiles/profiles/language-data-commons-collection-profile.json'

export const profiles = [base, schema, language_collection, software];
