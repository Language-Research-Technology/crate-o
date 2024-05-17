const profileUrls = [
    'https://language-research-technology.github.io/ro-crate-modes/modes/default.json',
    'https://language-research-technology.github.io/ro-crate-modes/modes/language-data-commons-collection.json',
    'https://language-research-technology.github.io/ro-crate-modes/modes/schema.json',
    'https://language-research-technology.github.io/ro-crate-modes/modes/software.json',
    'https://language-research-technology.github.io/ro-crate-modes/modes/base.json',
];
export const profiles = profileUrls.map(p => null);
const p = profileUrls.map((url, i) => fetch(url).then(r => r.ok ? r.json().then(json => profiles[i] = json) : null));
export const profilesPromise = Promise.allSettled(p);


