export default {
  async beforeCreate(event) {
    const { data } = event.params;

    if (data.type === 'Área' || data.type === 'Ãrea') {
      data.position_servicio = null;
      if (!data.position_area) {
        const items = await strapi.db.query('api::item.item').findMany({
          where: { type: data.type },
          orderBy: { position_area: 'desc' },
          limit: 1
        });
        data.position_area = items.length > 0 ? (items[0].position_area || 0) + 1 : 1;
      }
    } else if (data.type === 'Servicio') {
      data.position_area = null;
      if (!data.position_servicio) {
        const items = await strapi.db.query('api::item.item').findMany({
          where: { type: 'Servicio' },
          orderBy: { position_servicio: 'desc' },
          limit: 1
        });
        data.position_servicio = items.length > 0 ? (items[0].position_servicio || 0) + 1 : 1;
      }
    }
  },

  async beforeUpdate(event) {
    const { data } = event.params;

    if (data.type === 'Área' || data.type === 'Ãrea') {
      data.position_servicio = null;
    } else if (data.type === 'Servicio') {
      data.position_area = null;
    }
  }
};
