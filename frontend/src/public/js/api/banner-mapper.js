export function normalizeText(value) {
    return String(value || '').trim();
}

export function isValidMediaUrl(url) {
    var value = normalizeText(url);
    if (!value) return false;
    if (/^\/media\//i.test(value)) return true;
    try {
        var parsed = new URL(value);
        return parsed.protocol === 'https:' || parsed.protocol === 'http:';
    } catch {
        return false;
    }
}

export function sanitizeMediaUrl(url, sanitizer) {
    var safeValue = sanitizer.sanitize(normalizeText(url));
    return isValidMediaUrl(safeValue) ? safeValue : null;
}

export function mapIdentityData(apiResponse) {
    if (!apiResponse || !apiResponse.success || !apiResponse.data) {
        return null;
    }
    const d = apiResponse.data;
    return {
        id: d.id,
        title: d.title || '',
        description: d.description || '',
        imageUrl: d.imageUrl || null,
        imageAlt: d.imageAlt || 'KernoTec',
        videoUrl: d.videoUrl || null,
        titleUs: d.titleUs || '',
        descriptionUs: d.descriptionUs || '',
        correo: d.correo || '',
        locationText: d.locationText || '',
        locationUrl: d.locationUrl || '',
        accordion: (d.accordion || []).map(acc => ({
            title: acc.title || '',
            description: acc.description || '',
            mediaUrl: acc.mediaUrl || null,
            mediaAlt: acc.mediaAlt || '',
            isVideo: acc.isVideo || false
        })),
        social: (d.social || []).map(item => ({
            name: item.name || '',
            url: item.url || ''
        }))
    };
}
