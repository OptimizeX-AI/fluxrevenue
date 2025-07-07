// postcss.config.js - Versão definitiva
module.exports = {
  plugins: {
    'postcss-import': {},
    'postcss-custom-properties': {
      preserve: true,
      importFrom: './src/styles/components.css',  // ✅ Arquivo principal
      // Processar todas as variables que components.css importa
    },
    tailwindcss: {},
    autoprefixer: {},
  },
}
