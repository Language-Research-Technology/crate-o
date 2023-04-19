
export function crateDataService() {
    const crateDataService = (type, queryString) => {
        if (!crate) {
            return [];
        }
        if (!entitiesByType[type]) {
            const regexp = new RegExp()
            entitiesByType[type] = Array.from(crate.entities({filter: {'@type': regexp}}));
        }
        const results = queryString
            ? entities.value.filter(createFilter(queryString))
            : entities.value;

        return results;
    }
    return {
        crateDataService
    }
}
