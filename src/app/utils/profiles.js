const profileUrls = [
    'https://language-research-technology.github.io/ro-crate-editor-profiles/profiles/base-profile.json',
    'https://language-research-technology.github.io/ro-crate-editor-profiles/profiles/schema.json',
    'https://language-research-technology.github.io/ro-crate-editor-profiles/profiles/language-data-commons-collection-profile.json',
    'https://language-research-technology.github.io/ro-crate-editor-profiles/profiles/software-profile.json'
];
export const profiles = profileUrls.map(p => null);
const p = profileUrls.map((url, i) => fetch(url).then(r => r.ok ? r.json().then(json => profiles[i] = json) : null));
export const profilesPromise = Promise.allSettled(p);


