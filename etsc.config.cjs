module.exports = {
  esbuild: {
    format: 'esm',
    platform: 'node',
    target: 'node16',
    outdir: 'build',
    sourcemap: true,
    bundle: true,
    minify: false,
    keepNames: true,
    external: [
      'puppeteer',
      'mermaid',
      'langchain',
      'openai',
      'axios',
      'zod',
      'isomorphic-git',
      'memfs'
    ]
  },
  assets: {
    baseDir: 'src',
    outDir: 'build',
    filePatterns: ['**/*.json'],
  },
};