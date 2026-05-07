function createSlug(text) {
    if (!text) return '';
    return text
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

function createVideoClass(position) {
    const classes = ['i1', 'i2', 'i3', 'i4'];
    return classes[position % classes.length] || 'i1';
}

function slideMapper(item, index) {
    return {
        id: item.id,
        title: item.title || 'Sin título',
        description: item.description || '',
        position: item.position || index + 1,
        imageUrl: item.imageUrl || null,
        videoUrl: item.videoUrl || null,
        slug: createSlug(item.title),
        videoClass: createVideoClass(index),
        textClass: String.fromCharCode(66 + index)
    };
}

function mapCarouselData(apiResponse) {
    if (!apiResponse?.data?.slides) {
        return [];
    }
    
    return apiResponse.data.slides.map((item, index) => slideMapper(item, index));
}
