export async function lookup({query, limit = 10}){
        const api = "https://api.ror.org/organizations";
        let response = await fetch(`${api}?query.advanced=${query}`);
        if (response.status === 200) {
            response = await response.json();
            response = response.items.slice(0, limit).map((item) => {
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

