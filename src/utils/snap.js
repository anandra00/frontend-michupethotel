export const loadSnapScript = () => {
  return new Promise((resolve, reject) => {
    if (window.snap) {
      resolve(window.snap);
      return;
    }
    const isProduction = import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === 'true';
    const script = document.createElement('script');
    script.src = isProduction
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', import.meta.env.VITE_MIDTRANS_CLIENT_KEY);
    script.onload = () => {
      resolve(window.snap);
    };
    script.onerror = () => {
      console.error('Failed to load Midtrans Snap script');
      resolve(null); // resolve null so callers can handle gracefully
    };
    document.body.appendChild(script);
  });
};
