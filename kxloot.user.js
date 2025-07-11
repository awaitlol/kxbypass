// ==UserScript==
// @name         kxBypass LootLabs
// @namespace    https://discord.gg/pqEBSTqdxV
// @version      v1.0
// @description  Bypass Lootlinks only, we hate Lootlabs!!
// @author       awaitlol.
// @match        https://lootlinks.co/*
// @match        https://loot-links.com/*
// @match        https://loot-link.com/*
// @match        https://linksloot.net/*
// @match        https://lootdest.com/*
// @match        https://lootlink.org/*
// @match        https://lootdest.info/*
// @match        https://lootdest.org/*
// @match        https://links-loot.com/*
// @icon         https://i.pinimg.com/736x/aa/2a/e5/aa2ae567da2c40ac6834a44abbb9e9ff.jpg
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    "use strict";

    function handleLootlinks() {

        const originalFetch = window.fetch;
        window.fetch = async function (...args) {
            const [resource] = args;
            const url = typeof resource === "string" ? resource : resource.url;

            if (url.includes("/tc")) {
                try {
                    const response = await originalFetch(...args);
                    const data = await response.clone().json();

                    if (Array.isArray(data) && data.length > 0) {
                        const { urid, task_id, action_pixel_url, session_id } = data[0];
                        const shard = parseInt(urid.slice(-5)) % 3;

                        const ws = new WebSocket(
                            `wss://${shard}.${INCENTIVE_SERVER_DOMAIN}/c?uid=${urid}&cat=${task_id}&key=${KEY}&session_id=${session_id}&is_loot=1&tid=${TID}`
                        );

                        ws.onopen = () => setInterval(() => ws.send("0"), 1000);

                        ws.onmessage = (e) => {
                            if (e.data.startsWith("r:")) {
                                const encodedString = e.data.slice(2);
                                try {
                                    const destinationUrl = decodeURI(encodedString);
                                    showBypassResult(destinationUrl);
                                } catch (err) {
                                    console.error("Decryption error:", err);
                                    showErrorUI("Failed to decrypt the URL");
                                }
                            }
                        };

                        navigator.sendBeacon(
                            `https://${shard}.${INCENTIVE_SERVER_DOMAIN}/st?uid=${urid}&cat=${task_id}`
                        );
                        fetch(`https:${action_pixel_url}`);
                        fetch(
                            `https://${INCENTIVE_SYNCER_DOMAIN}/td?ac=auto_complete&urid=${urid}&cat=${task_id}&tid=${TID}`
                        );
                    }

                    return response;
                } catch (err) {
                    console.error("Bypass error:", err);
                    showErrorUI("Bypass failed - please try again");
                    return originalFetch(...args);
                }
            }

            return originalFetch(...args);
        };

        window.open = () => null;

        setTimeout(() => {
            document.open();
            document.write("");
            document.close();
            createBypassUI();
        }, 4000);

        function decodeURI(encodedString, prefixLength = 5) {
            let decodedString = "";
            const base64Decoded = atob(encodedString);
            const prefix = base64Decoded.substring(0, prefixLength);
            const encodedPortion = base64Decoded.substring(prefixLength);

            for (let i = 0; i < encodedPortion.length; i++) {
                const encodedChar = encodedPortion.charCodeAt(i);
                const prefixChar = prefix.charCodeAt(i % prefix.length);
                const decodedChar = encodedChar ^ prefixChar;
                decodedString += String.fromCharCode(decodedChar);
            }

            return decodedString;
        }

        function createBypassUI() {
            const overlay = document.createElement("div");
            overlay.id = "kxBypass-overlay";
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.95);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 999999;
                color: white;
                font-family: 'Poppins', sans-serif;
            `;
            overlay.innerHTML = `
                <div style="font-size: 24px; margin-bottom: 20px;">Bypassing Lootlinks...</div>
                <div style="width: 50px; height: 50px; border: 5px solid #f3f3f3; border-top: 5px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <div style="margin-top: 20px; font-size: 16px;">This may take up to 60 seconds</div>
            `;
            document.body.appendChild(overlay);

            const style = document.createElement("style");
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }

        function showBypassResult(destinationUrl) {
            let overlay = document.getElementById("kxBypass-overlay");
            if (!overlay) {
                createBypassUI();
                overlay = document.getElementById("kxBypass-overlay");
            }

            overlay.innerHTML = `
                <div style="font-size: 24px; margin-bottom: 20px;">Bypass Successful!</div>
                <div style="font-size: 16px; margin-bottom: 20px; word-break: break-all; max-width: 80%;">${destinationUrl}</div>
                <button style="padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">Continue to Link</button>
            `;
            overlay.querySelector("button").onclick = () => {
                window.location.href = destinationUrl;
            };
        }

        function showErrorUI(message) {
            let overlay = document.getElementById("kxBypass-overlay");
            if (!overlay) {
                createBypassUI();
                overlay = document.getElementById("kxBypass-overlay");
            }

            overlay.innerHTML = `
                <div style="font-size: 24px; margin-bottom: 20px; color: #e74c3c;">Error Occurred</div>
                <div style="font-size: 16px; margin-bottom: 20px;">${message}</div>
                <div style="font-size: 14px; color: #aaa;">Check console for details</div>
            `;
        }
    }

    // Inject required font
    const font = document.createElement("link");
    font.rel = "stylesheet";
    font.href = "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap";
    document.head.appendChild(font);

    // Start handler
    if (window.location.href.includes("loot")) handleLootlinks();
})();
