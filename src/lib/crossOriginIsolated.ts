// When the page is cross-origin isolated (COOP/COEP set), SharedArrayBuffer is
// available, which lets Pyodide support a hard keyboard-interrupt during long
// runs. Otherwise we can only fall back to terminating the worker.
export const canHardInterrupt = typeof SharedArrayBuffer !== 'undefined'
