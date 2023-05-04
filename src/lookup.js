export class Lookup {
    constructor() {
    }

    async external({query}) {
        let response = await fetch("https://lookups.ldaca.edu.au/data/_search", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "ApiKey bXJWcEVvY0JrZXVEdG93dy14c046YndJOVBLcGFUVk9zQW0xN282NERSQQ==" // Read only api-key
            },
            body: JSON.stringify({
                query,
                from: 0,
                size: 10,
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
        return {total, documents};
    }

    async ror({searchQuery, size = 10}) {
        const api = "https://api.ror.org/organizations";
        let response = await fetch(`${api}?query.advanced=${searchQuery}`);
        if (response.status === 200) {
            response = await response.json();
            response = response.items.slice(0, size).map((item) => {
                return {
                    "@id": item.id,
                    "@type": "Organization",
                    name: item.name,
                };
            });
            return response;
        }
        return [];
    }
}
