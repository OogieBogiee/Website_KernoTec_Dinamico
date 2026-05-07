import type { Core } from '@strapi/strapi';

export default {
  register({ strapi }: { strapi: Core.Strapi }) {
    strapi.customFields.register({
      name: 'unique-position',
      plugin: undefined,
      type: 'integer',
    });
  },
  bootstrap() {},
};
