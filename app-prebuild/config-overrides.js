const path = require('path');
const webpack = require('webpack');
const Dotenv = require('dotenv-webpack');

module.exports = function override(config, env) {
  // Aliases existentes
  config.resolve.alias = {
    ...config.resolve.alias,
    '@': path.resolve(__dirname, 'src'),
    '@/components': path.resolve(__dirname, 'src/components'),
    '@/hooks': path.resolve(__dirname, 'src/hooks'),
    '@/utils': path.resolve(__dirname, 'src/utils'),
    '@/contexts': path.resolve(__dirname, 'src/contexts'),
    '@/lib': path.resolve(__dirname, 'src/lib'),
    '@/styles': path.resolve(__dirname, 'src/styles')
  };

  // CRITICAL: Adicionar dotenv-webpack plugin
  config.plugins.push(
    new Dotenv({
      path: path.resolve(__dirname, '.env'),
      safe: false,
      systemvars: true,
      silent: false
    })
  );

  // CRITICAL: DefinePlugin para garantir injeção das variáveis Supabase
  config.plugins.push(
    new webpack.DefinePlugin({
      'process.env.REACT_APP_SUPABASE_URL': JSON.stringify(
        process.env.REACT_APP_SUPABASE_URL || 'https://cykfgwzzvlnkqundyxrq.supabase.co'
      ),
      'process.env.REACT_APP_SUPABASE_ANON_KEY': JSON.stringify(
        process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5a2Znd3p6dmxua3F1bmR5eHJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MTk4NDEsImV4cCI6MjA2NTM5NTg0MX0.WRUOjlQfcxLsbu5JuF_7LbCOsY3cuTZwdCAkdiOQXPg'
      ),
      'process.env.NODE_ENV': JSON.stringify(env)
    })
  );

  // CRITICAL: Configuração completa para produção
  if (env === 'production') {
    config.output.publicPath = '/';
    
    // ADICIONAR: Configurações essenciais para chunks
    config.output.filename = 'static/js/[name].[contenthash:8].js';
    config.output.chunkFilename = 'static/js/[name].[contenthash:8].chunk.js';
    
    // ADICIONAR: Otimização de splitChunks
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          priority: 5,
          enforce: true
        }
      }
    };
    
    // ADICIONAR: Runtime chunk separado
    config.optimization.runtimeChunk = {
      name: 'runtime'
    };
  }

  return config;
};
