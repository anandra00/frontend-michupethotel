export const loadSnapScript = () => {
  return new Promise((resolve) => {
    if (window.snap) {
      resolve(window.snap);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', import.meta.env.VITE_MIDTRANS_CLIENT_KEY);
    script.onload = () => {
      resolve(window.snap);
    };
    script.onerror = () => {
      resolve(null);
    };
    document.body.appendChild(script);
  });
};
