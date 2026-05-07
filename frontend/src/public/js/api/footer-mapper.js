function isValidHttpsUrl(url) {
    if (!url) return false;
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'https:' || parsed.protocol === 'http:';
    } catch {
        return false;
    }
}

function isValidEmailFormat(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateSocialItem(item) {
    if (!item || typeof item !== 'object') return null;
    
    const url = String(item.url || '').trim();
    const name = String(item.name || '').trim();
    
    if (!url || !name) return null;
    
    if (!/^https?:\/\//i.test(url) && !/^mailto:/i.test(url)) {
        return null;
    }
    
    return {
        name: name,
        url: url
    };
}

function normalizeMapUrl(locationUrl) {
    if (!locationUrl) return null;
    const value = String(locationUrl).trim();
    const iframeMatch = value.match(/<iframe[^>]*\ssrc\s*=\s*['"]([^'"]+)['"]/i);
    let extracted = value;
    
    if (iframeMatch && iframeMatch[1]) {
        extracted = iframeMatch[1].trim();
    } else {
        const srcAttrMatch = value.match(/src\s*=\s*['"]([^'"]+)['"]/i);
        if (srcAttrMatch && srcAttrMatch[1]) {
            extracted = srcAttrMatch[1].trim();
        }
    }
    if (!isValidHttpsUrl(extracted)) return null;
    const isGoogleMaps = extracted.includes('google.com/maps') || extracted.includes('maps.google.com');
    const isLocalProxy = extracted.startsWith('/api/') || extracted.startsWith('/'); 

    if (isGoogleMaps || isLocalProxy) {
        return extracted;
    }
    return null; 
}

export function mapFooterData(apiResponse) {
    if (!apiResponse || !apiResponse.success || !apiResponse.data) {
        return {
            correo: null,
            locationText: null,
            locationUrl: null,
            social: [],
            year: new Date().getFullYear()
        };
    }
    
    const data = apiResponse.data;
    
    const correo = (data.correo && isValidEmailFormat(data.correo))
        ? data.correo
        : null;
    
    const locationText = data.locationText ? String(data.locationText).trim() : null;
    
    const locationUrl = normalizeMapUrl(data.locationUrl);
    
    const social = Array.isArray(data.social)
        ? data.social
            .map(validateSocialItem)
            .filter(item => item !== null)
        : [];
    
    return {
        correo: correo,
        locationText: locationText,
        locationUrl: locationUrl,
        social: social,
        year: new Date().getFullYear()
    };
}
