const api = "https://api.ror.org/organizations";

export default class Lookup {
  constructor(opt) {

  }
  async search({ query, limit = 10 }) {
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
}