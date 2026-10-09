/// <reference types="vite/client" />

declare module 'summernote/dist/summernote-lite.js';
declare module 'summernote/dist/summernote-lite.css';

interface JQuery {
    summernote(...args: unknown[]): JQuery;
}
