export default (plugin) => {
  plugin.controllers.upload.upload = async (ctx) => {
    const files = ctx.request.files;
    
    if (!files || !files.files) {
      return ctx.badRequest('No files uploaded');
    }

    const fileArray = Array.isArray(files.files) ? files.files : [files.files];

    for (const file of fileArray) {
      const { mimetype, size } = file;
      
      const isImage = mimetype.startsWith('image/');
      const isVideo = mimetype.startsWith('video/');

      if (isImage) {
        const allowedImageTypes = ['image/png', 'image/webp'];
        const maxImageSize = 300 * 1024;

        if (!allowedImageTypes.includes(mimetype)) {
          return ctx.badRequest(
            `Invalid image format. Only PNG and WebP are allowed. Received: ${mimetype}`
          );
        }

        if (size > maxImageSize) {
          return ctx.badRequest(
            `Image file too large. Maximum size is 300KB. File size: ${Math.round(size / 1024)}KB`
          );
        }
      }

      if (isVideo) {
        const allowedVideoTypes = ['video/webm', 'video/av1', 'video/x-matroska'];
        const maxVideoSize = 2 * 1024 * 1024;

        if (!allowedVideoTypes.includes(mimetype)) {
          return ctx.badRequest(
            `Invalid video format. Only WebM and AV1 are allowed. Received: ${mimetype}`
          );
        }

        if (size > maxVideoSize) {
          return ctx.badRequest(
            `Video file too large. Maximum size is 2MB. File size: ${Math.round(size / (1024 * 1024))}MB`
          );
        }
      }
    }

    return strapi.plugin('upload').controller('upload').upload(ctx);
  };

  return plugin;
};
