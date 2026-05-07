export function createSlug(title) {
    if (!title) return '';
    return title
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/^-+|-+$/g, '');
}

export function createAnchor(item) {
    if (!item || !item.title) return '#';
    
    const slug = createSlug(item.title);
    
    return `#t${slug}`;
}

export function mapNavbarItem(item) {
    if (!item || typeof item !== 'object') {
        return null;
    }

    return {
        id: item.id,
        title: item.title || 'Sin título',
        position: item.position || 999,
        type: item.type || 'Área',
        anchor: createAnchor(item),
        slug: createSlug(item.title || '')
    };
}

export function mapNavbarData(apiResponse) {
    if (!apiResponse || !apiResponse.data) {
        return { areas: [], servicios: [] };
    }

    const data = apiResponse.data;

    return {
        areas: (data.areas || [])
            .map(mapNavbarItem)
            .filter(item => item !== null),
        servicios: (data.servicios || [])
            .map(mapNavbarItem)
            .filter(item => item !== null),
        source: apiResponse.source || 'unknown'
    };
}

export function isValidItem(item) {
    return item && 
           typeof item === 'object' && 
           item.title && 
           typeof item.position === 'number' &&
           (item.type === 'Área' || item.type === 'Servicio');
}
