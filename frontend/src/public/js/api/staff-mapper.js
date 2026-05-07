function generateStaffSlug(text) {
    if (!text) return 'staff';
    
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 30);
}

function sanitizeClassToken(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-');
}

function normalizeText(value) {
    return String(value || '').trim();
}

function normalizeMediaUrl(url) {
    const value = normalizeText(url);
    if (!value) {
        return null;
    }

    if (/^\/media\//i.test(value)) {
        return value;
    }

    try {
        const parsed = new URL(value);
        if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
            return parsed.href;
        }
    } catch {
        return null;
    }

    return null;
}

function toCssUrl(url) {
    return String(url || '')
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n|\r|\f/g, '');
}

function simulateStaffGrid(totalMembers, isDesktop) {
    const cols = isDesktop ? 8 : 6;
    const grid = [];
    function mark(y, x) { if (!grid[y]) grid[y] = []; grid[y][x] = true; }
    function isOccupied(y, x) { return grid[y] && grid[y][x]; }
    if (totalMembers > 0) {
        if (isDesktop) {
            if (totalMembers > 8) { mark(1, 3); mark(1, 4); mark(1, 5); }
            if (totalMembers > 8) { mark(2, 2); mark(2, 3); mark(2, 4); }
            if (totalMembers > 11) { mark(3, 1); mark(3, 2); mark(3, 3); }
            if (totalMembers > 11) { mark(3, 4); }
        } else {
            if (totalMembers > 8) { mark(1, 2); mark(1, 3); mark(1, 4); }
            if (totalMembers > 8) { mark(4, 1); mark(4, 2); mark(4, 3); }
        }
    }
    const memberCoords = [];
    let currX = 0, currY = 0;
    for (let i = 0; i < totalMembers; i++) {
        while (isOccupied(currY, currX)) {
            currX++;
            if (currX >= cols) { currX = 0; currY++; }
        }
        memberCoords.push({ x: currX, y: currY });
        mark(currY, currX);
    }
    return memberCoords;
}

function getLayoutPositionClass(coord, maxY, cols) {
    const isLeftHalf = coord.x < (cols / 2);
    if (coord.y === 0) return isLeftHalf ? 'detalleBottomRight' : 'detalleBottomLeft';
    if (coord.y === maxY) return isLeftHalf ? 'detalleTopRight' : 'detalleTopLeft';
    return isLeftHalf ? 'detalleRight' : 'detalleLeft';
}

function mapStaffMember(member, index, detailPosition, responsiveDetailPosition) {
    const baseSlug = generateStaffSlug(member.full_name);
    const uniquePart = sanitizeClassToken(member.id || index + 1);
    const slug = baseSlug + '-' + uniquePart;
    const classSuffix = slug.charAt(0).toUpperCase() + slug.slice(1);
    
    return {
        id: member.id,
        fullName: normalizeText(member.full_name),
        position: normalizeText(member.position_staff),
        saying: normalizeText(member.saying),
        slug: slug,
        detailClass: detailPosition,
        responsiveDetailClass: responsiveDetailPosition,
        images: {
            colorFront: member.image_color_front ? {
                url: normalizeMediaUrl(member.image_color_front.url),
                alt: normalizeText(member.image_color_front.alt)
            } : null,
            colorTop: member.image_color_top ? {
                url: normalizeMediaUrl(member.image_color_top.url),
                alt: normalizeText(member.image_color_top.alt)
            } : null,
            working: member.image_working ? {
                url: normalizeMediaUrl(member.image_working.url),
                alt: normalizeText(member.image_working.alt)
            } : null
        },
        cssClasses: {
            front: `front${classSuffix}`,
            right: `right${classSuffix}`,
            bottom: `bottom${classSuffix}`,
            detalle: `detalle${classSuffix}`
        }
    };
}

export function mapStaffData(apiResponse) {
    if (!apiResponse || !apiResponse.success || !apiResponse.data) {
        return [];
    }

    const members = apiResponse.data.members || [];

    const shuffled = [...members];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const totalMembers = shuffled.length;
    const desktopCoords = simulateStaffGrid(totalMembers, true);
    const responsiveCoords = simulateStaffGrid(totalMembers, false);
    let maxDesktopY = 0, maxResponsiveY = 0;
    if (totalMembers > 0) {
        maxDesktopY = Math.max(...desktopCoords.map(c => c.y));
        maxResponsiveY = Math.max(...responsiveCoords.map(c => c.y));
    }
    return shuffled.map((member, index) => {
        const detailPos = getLayoutPositionClass(desktopCoords[index], maxDesktopY, 8);
        const respDetailPos = getLayoutPositionClass(responsiveCoords[index], maxResponsiveY, 6);
        return mapStaffMember(member, index, detailPos, respDetailPos);
    });
}

export function generateStaffCSS(mappedMembers) {
    let css = '';
    
    mappedMembers.forEach(member => {
        const { cssClasses, images } = member;
        
        if (images.colorFront && images.colorFront.url) {
            const safeFrontUrl = toCssUrl(images.colorFront.url);
            css += `.${cssClasses.front} {\n`;
            css += `  background-image: url("${safeFrontUrl}");\n`;
            css += `  background-size: cover;\n`;
            css += `  background-position: center;\n`;
            css += `}\n\n`;
        }
        
        if (images.colorFront && images.colorFront.url) {
            const safeRightUrl = toCssUrl(images.colorFront.url);
            css += `.${cssClasses.right} {\n`;
            css += `  background-image: url("${safeRightUrl}");\n`;
            css += `  background-size: cover;\n`;
            css += `  background-position: center;\n`;
            css += `}\n\n`;
        }

        if (images.colorTop && images.colorTop.url) {
            const safeBottomUrl = toCssUrl(images.colorTop.url);
            css += `.${cssClasses.bottom} {\n`;
            css += `  background-image: url("${safeBottomUrl}");\n`;
            css += `  background-size: cover;\n`;
            css += `  background-position: center;\n`;
            css += `}\n\n`;
        }
        
        if (images.working && images.working.url) {
            const safeWorkingUrl = toCssUrl(images.working.url);
            const posClasses = [...new Set([member.detailClass, member.responsiveDetailClass])];
            posClasses.forEach(pos => {
                css += `.${pos}.${cssClasses.detalle} {\n`;
                css += `  background: linear-gradient(25deg, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0.6)),\n`;
                css += `    url("${safeWorkingUrl}");\n`;
                css += `  background-position: center;\n`;
                css += `  background-size: cover;\n`;
                css += `}\n\n`;
            });
        }
    });
    
    return css;
}

