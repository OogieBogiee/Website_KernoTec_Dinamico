// item controller
import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::item.item', ({ strapi }) => ({
  async checkPosition(ctx) {
    const { type, position, excludeId } = ctx.query;

    if (!type || !position) {
      return ctx.badRequest('Missing type or position');
    }

    const filters: any = {
      type: type,
    };
    
    if (type === 'Área' || type === 'Ãrea') {
      filters.position_area = position;
    } else if (type === 'Servicio') {
      filters.position_servicio = position;
    }

    if (excludeId && excludeId !== 'undefined' && excludeId !== 'null') {
      filters.id = { $ne: excludeId };
    }

    const items = await strapi.db.query('api::item.item').findMany({
      where: filters,
    });

    const isOccupied = items.length > 0;
    
    let occupiedBy = null;
    if (isOccupied) {
      occupiedBy = items[0].title_item;
    }

    return {
      isOccupied,
      occupiedBy,
    };
  }
}));
