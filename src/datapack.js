import * as esb from 'elastic-builder';
export async function lookup({query, limit = 10, fields}) {

    let phraseQuery = [];
    for (let field of fields) {
        phraseQuery.push(esb.matchPhraseQuery(field, query));
    }
    const boolQueryObj = esb.boolQuery().should(phraseQuery);
    const esbQuery = esb.requestBodySearch().query(boolQueryObj);
    const elasticQuery = esbQuery.toJSON().query;

    let response = await fetch("https://lookups.ldaca.edu.au/data/_search", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "ApiKey bXJWcEVvY0JrZXVEdG93dy14c046YndJOVBLcGFUVk9zQW0xN282NERSQQ==" // Read only api-key
        },
        body: JSON.stringify({
            query: elasticQuery,
            from: 0,
            size: limit,
            sort: []
        }),
    });
    let status = response.status;
    response = await response.json();
    if (status !== 200) {
        return response;
    }
    const total = response.hits.total.value;
    const documents = response.hits.hits.map((doc) => ({...doc._source}));
    return documents;
}

