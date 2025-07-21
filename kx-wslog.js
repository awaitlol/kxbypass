// ==UserScript==
// @name         kxBypass WebSocket Monitor [Public Release]
// @namespace    https://discord.gg/pqEBSTqdxV
// @version      1.0
// @description  Monitor Websockets Inputs and Outputs.
// @match        *://*/*
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    const hookScript = `
        (function() {
            function customLogger(...args) {
                try {
                    if (window.console && typeof window.console.info === 'function') {
                        console.info(...args);
                    }
                } catch (error) {
                    console.log("Logging failed: " + error);
                }
            }

            const OriginalWebSocket = window.WebSocket;

            window.WebSocket = function (...args) {
                const socket = new OriginalWebSocket(...args);
                customLogger('[WS Injected] ➕ Connection to', args[0]);

                socket.addEventListener('message', event => {
                    customLogger('[WS Injected] 📩 Received:', event.data);
                });

                const originalSend = socket.send;
                socket.send = function (data) {
                    customLogger('[WS Injected] 📤 Sent:', data);
                    return originalSend.call(this, data);
                };

                return socket;
            };

            window.WebSocket.prototype = OriginalWebSocket.prototype;
            customLogger('%c[WS Injected] ✅ WebSocket monitoring injected.', 'color: limegreen;');
        })();
    `;

    const script = document.createElement('script');

    // Use Trusted Types API
    if (window.trustedTypes && trustedTypes.createPolicy) {
        const policy = trustedTypes.createPolicy('kxBypass', {
            createScript: (input) => input
        });
        script.text = policy.createScript(hookScript);
    } else {
        script.text = hookScript;
    }

    document.documentElement.appendChild(script);
})();
