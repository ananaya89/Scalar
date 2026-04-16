let appPromise;

module.exports = async (req, res) => {
  if (!appPromise) {
    appPromise = import('../server/app.js').then((module) => module.default);
  }

  const app = await appPromise;
  return app(req, res);
};
