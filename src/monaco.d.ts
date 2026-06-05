// Monaco's deep ESM entry points ship no bundled type declarations. The editor
// API surface is identical to the top-level package, and the language
// contributions are side-effect-only imports.
declare module 'monaco-editor/esm/vs/editor/editor.api' {
  export * from 'monaco-editor'
}
declare module 'monaco-editor/esm/vs/basic-languages/*'
