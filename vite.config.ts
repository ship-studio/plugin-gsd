import { defineConfig } from 'vite';

const reactDataUrl = `data:text/javascript,export default window.__SHIPSTUDIO_REACT__;export const useState=window.__SHIPSTUDIO_REACT__.useState;export const useEffect=window.__SHIPSTUDIO_REACT__.useEffect;export const useCallback=window.__SHIPSTUDIO_REACT__.useCallback;export const useMemo=window.__SHIPSTUDIO_REACT__.useMemo;export const useRef=window.__SHIPSTUDIO_REACT__.useRef;export const useContext=window.__SHIPSTUDIO_REACT__.useContext;export const createElement=window.__SHIPSTUDIO_REACT__.createElement;export const Fragment=window.__SHIPSTUDIO_REACT__.Fragment;`;

const jsxRuntimeDataUrl = `data:text/javascript,const R=window.__SHIPSTUDIO_REACT__;function jsx(t,p,k){const{children:c,...r}=p;if(k!==undefined)r.key=k;return c!==undefined?Array.isArray(c)?R.createElement(t,r,...c):R.createElement(t,r,c):R.createElement(t,r)}export{jsx,jsx as jsxs};export const Fragment=R.Fragment;`;

const reactDomDataUrl = `data:text/javascript,export default window.__SHIPSTUDIO_REACT_DOM__`;

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.tsx',
      formats: ['es'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        paths: {
          'react': reactDataUrl,
          'react-dom': reactDomDataUrl,
          'react/jsx-runtime': jsxRuntimeDataUrl,
        },
      },
    },
    minify: false,
    outDir: 'dist',
    emptyOutDir: true,
  },
});
