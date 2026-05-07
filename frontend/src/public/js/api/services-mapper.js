function generateSlug(text) {
    if (!text) return '';
    return text
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/^-+|-+$/g, '');
}

function asString(value, fallback = '') {
    return typeof value === 'string' ? value : fallback;
}

function asArray(value) {
    return Array.isArray(value) ? value : [];
}

function asMediaUrl(value) {
    const url = asString(value, '');
    if (!url) return '';
    return url;
}

function getSVGByPosition(skillIndex, totalSkills, colorSuffix) {
    let svgType;
    const positionInRow = skillIndex % 3;
    
    if (totalSkills === 1) {
        svgType = 'card-bottom-line';
    } else if (totalSkills === 2) {
        svgType = (skillIndex === 0) ? 'bottom-right' : 'bottom-left';
    } else {
        if (positionInRow === 0) {
            svgType = 'bottom-right';
        } else if (positionInRow === 1) {
            svgType = 'card-bottom-duo';
        } else {
            svgType = 'bottom-left';
        }
    }
    
    const finalColor = (svgType === 'card-bottom-duo' && colorSuffix === 'stealblue') 
        ? 'steelblue' 
        : colorSuffix;
    
    return `img/svg/${svgType}-${finalColor}.svg`;
}

function getAllSVGVariants(colorSuffix) {
    const correctedColor = (colorSuffix === 'stealblue') ? 'steelblue' : colorSuffix;
    const keepOriginal = colorSuffix;
    
    return {
        singleItem: `img/svg/card-bottom-line-${keepOriginal}.svg`,
        twoColLeft: `img/svg/bottom-right-${keepOriginal}.svg`,
        twoColRight: `img/svg/bottom-left-${keepOriginal}.svg`,
        threeColLeft: `img/svg/bottom-right-${keepOriginal}.svg`,
        threeColCenter: `img/svg/card-bottom-duo-${correctedColor}.svg`,
        threeColRight: `img/svg/bottom-left-${keepOriginal}.svg`
    };
}

function getSecondarySVG(colorSuffix) {
    return `img/svg/card-bottom-line-${colorSuffix}.svg`;
}

function getIsotipoConfig(globalIndex) {
    const isOdd = globalIndex % 2 !== 0;
    
    if (isOdd) {
        return {
            url: 'img/fotos/isotipo-kernotec.png',
            class: 'service-isotipo',
            position: { top: 'auto', bottom: '-105px', right: '40px' }
        };
    } else {
        return {
            url: 'img/svg/isotipo-kernotec.svg',
            class: 'service-isotipo',
            position: { bottom: '-105px', left: '10px' }
        };
    }
}

export function mapServicesData(apiResponse) {
    if (!apiResponse || !apiResponse.data || !apiResponse.data.items) {
        return [];
    }

    const items = asArray(apiResponse.data.items);

    return items.map((item, index) => {
        const globalIndex = index + 1;
        const isOdd = globalIndex % 2 !== 0;
        const titleItem = asString(item?.title_item, 'Sin titulo');
        const slug = generateSlug(titleItem);
        const isotipo = getIsotipoConfig(globalIndex);
        const sectionClass = 'service-section';

        const skillsArray = asArray(item?.skills);
        const totalSkills = skillsArray.length;

        const mappedSkills = skillsArray.map((skill, skillIndex) => {
            const frontColor = isOdd ? 'stealblue' : 'orange';
            const backColor = isOdd ? 'orange' : 'stealblue';
            
            const svgFrontVariants = getAllSVGVariants(frontColor);
            const svgBackVariants = getAllSVGVariants(backColor);
            const svgFront2 = getSecondarySVG(frontColor);
            const svgBack2 = getSecondarySVG(backColor);
            
            const mappedTechnologies = asArray(skill?.technologies).map(tech => ({
                id: tech?.id,
                name: asString(tech?.name, 'Sin nombre'),
                logo: {
                    url: asMediaUrl(tech?.logo?.url),
                    alt: asString(tech?.logo?.alt, asString(tech?.name, ''))
                },
                logo_width: tech?.logo_width === 'horizontal' ? 'horizontal' : 'vertical'
            }));

            const descriptionLong = asString(skill?.descriptionLong, asString(skill?.description, ''));
            const skillBackground = asArray(skill?.skill_background)
                .map(bg => ({
                    url: asMediaUrl(bg?.url),
                    alt: asString(bg?.alt, asString(skill?.title, ''))
                }))
                .filter(bg => !!bg.url);

            return {
                id: skill?.id,
                title: asString(skill?.title, 'Sin titulo'),
                description: asString(skill?.description, ''),
                descriptionLong: descriptionLong,
                iconUrl: asMediaUrl(skill?.skill_icon?.url),
                iconAlt: asString(skill?.skill_icon?.alt, asString(skill?.title, '')),
                backgroundImages: skillBackground,
                svgFront: {
                    ...svgFrontVariants,
                    svg2: svgFront2
                },
                svgBack: {
                    ...svgBackVariants,
                    svg2: svgBack2
                },
                technologies: mappedTechnologies
            };
        });

        return {
            id: item?.id,
            title: titleItem,
            description: asString(item?.description_short, ''),
            descriptionLong: asString(item?.description_long, asString(item?.description_short, '')),
            slug: slug,
            anchorId: 't' + slug,
            type: asString(item?.type, ''),
            globalIndex: globalIndex,
            isOdd: isOdd,
            sectionClass: sectionClass,
            backgroundUrl: asMediaUrl(item?.image_background?.url),
            backgroundAlt: asString(item?.image_background?.alt, titleItem),
            isotipo: isotipo,
            skills: mappedSkills
        };
    });
}
