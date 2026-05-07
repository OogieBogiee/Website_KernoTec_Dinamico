export default {
  routes: [
    {
      method: 'GET',
      path: '/items/check-position',
      handler: 'item.checkPosition',
      config: {
        auth: false,
      },
    },
  ],
};