export default class Lookup {
  constructor(opt) {
    this.fields = opt.fields;
  }
  async search({ query, limit = 10, fields = this.fields }) {
    let response = await fetch("https://lookups.ldaca.edu.au/data/_search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "ApiKey bXJWcEVvY0JrZXVEdG93dy14c046YndJOVBLcGFUVk9zQW0xN282NERSQQ==" // Read only api-key
      },
      body: JSON.stringify({
        query: {
          multi_match: { query, fields }
        },
        from: 0,
        size: limit,
        sort: []
      }),
    });
    let status = response.status;
    response = await response.json();
    if (status !== 200) {
      return [];
    }
    const total = response.hits.total.value;
    const documents = response.hits.hits.map((doc) => ({ ...doc._source }));
    return documents;
  }
}