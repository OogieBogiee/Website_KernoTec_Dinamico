function asArray(value) {
    return Array.isArray(value) ? value : [];
}

function asString(value, fallback = '') {
    return typeof value === 'string' ? value : fallback;
}

function asSafeUrl(value) {
    const url = asString(value, '');
    return /^https?:\/\//i.test(url) ? url : null;
}

function mapStakeholderItem(item) {
    return {
        id: item?.id,
        title: asString(item?.title, ''),
        iconUrl: asString(item?.iconUrl, ''),
        iconAlt: asString(item?.iconAlt, asString(item?.title, '')),
        url: asSafeUrl(item?.url),
        type: asString(item?.type, '')
    };
}

export function mapStakeholdersData(apiResponse) {
    if (!apiResponse || !apiResponse.data) {
        return { clientes: [], partners: [] };
    }

    const clientes = asArray(apiResponse.data.clientes)
        .map(mapStakeholderItem)
        .filter(item => !!item.iconUrl);

    const partners = asArray(apiResponse.data.partners)
        .map(mapStakeholderItem)
        .filter(item => !!item.iconUrl);

    return {
        clientes,
        partners
    };
}
