function normalizeText(value) {
    return String(value || '').trim();
}

function isValidMediaUrl(url) {
    const value = String(url || '').trim();
    if (!value) {
        return false;
    }

    if (/^\/media\//i.test(value)) {
        return true;
    }

    try {
        const parsed = new URL(value);
        return parsed.protocol === 'https:' || parsed.protocol === 'http:';
    } catch {
        return false;
    }
}

function mapAccordionItem(item) {
    const title = normalizeText(item && item.title);
    const description = normalizeText(item && item.description);
    const mediaUrlRaw = normalizeText(item && item.mediaUrl);
    const mediaUrl = isValidMediaUrl(mediaUrlRaw) ? mediaUrlRaw : null;
    const mediaAlt = normalizeText(item && item.mediaAlt) || title;
    const isVideo = Boolean(item && item.isVideo);

    if (!title && !description && !mediaUrl) {
        return null;
    }

    return {
        title,
        description,
        mediaUrl,
        mediaAlt,
        isVideo
    };
}

export function mapAccordionData(apiResponse) {
    if (!apiResponse || !apiResponse.success || !apiResponse.data) {
        return {
            hasData: false,
            titleUs: '',
            descriptionUs: '',
            accordion: []
        };
    }

    const data = apiResponse.data;
    const titleUs = normalizeText(data.titleUs);
    const descriptionUs = normalizeText(data.descriptionUs);
    const bgAccordionUrlRaw = String(data.bgAccordionUrl || '').trim();
    const bgAccordionUrl = isValidMediaUrl(bgAccordionUrlRaw) ? bgAccordionUrlRaw : null;
    const accordion = Array.isArray(data.accordion)
        ? data.accordion.map(mapAccordionItem).filter(Boolean)
        : [];

    return {
        hasData: Boolean(titleUs || descriptionUs || bgAccordionUrl || accordion.length),
        titleUs,
        descriptionUs,
        bgAccordionUrl,
        accordion
    };
}
