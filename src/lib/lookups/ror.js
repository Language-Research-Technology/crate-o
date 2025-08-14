const api = "https://api.ror.org/v2/organizations";

export default class Lookup {
  constructor(opt) {

  }
  async search({ query, limit = 20 }) {
    if (limit > 20) {
      throw Error(
        "crate-o has not implemented paging for the ROR lookup. ROR will only return a maximum of 20 results per page."
      );
    };
    let response = await fetch(`${api}?query.advanced=${query}`);
    if (response.status === 200) {
      response = await response.json();
      response = response.items.slice(0, limit).map((item) => {
        const displayName = item.names.find(
          (name) => name.types.includes("ror_display")
        );
        return {
          "@id": item.id,
          "@type": "Organization",
          name: displayName.value,
        };
      });
      return response;
    }
    return [];
  }
}