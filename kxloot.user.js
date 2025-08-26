// ==UserScript==
// @name         kxBypass LootLabs
// @namespace    https://discord.gg/pqEBSTqdxV
// @version      1.5
// @description  Bypass Lootlinks only, we hate Lootlabs!!
// @author       awaitlol
// @match        https://lootlinks.co/*
// @match        https://loot-links.com/*
// @match        https://loot-link.com/*
// @match        https://linksloot.net/*
// @match        https://lootdest.com/*
// @match        https://lootlink.org/*
// @match        https://lootdest.info/*
// @match        https://lootdest.org/*
// @match        https://links-loot.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    "use strict";

    let countdownInterval;

    const font = document.createElement("link");
    font.rel = "stylesheet";
    font.href = "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap";
    document.head.appendChild(font);

    // --- UI Overlay ---
    function createOverlay() {
        let overlay = document.getElementById("kxBypass-overlay");
        if (overlay) return overlay;

        overlay = document.createElement("div");
        overlay.id = "kxBypass-overlay";
        overlay.style.cssText = `
            position: fixed !important;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(15,15,15,0.96);
            display: flex; flex-direction: column;
            justify-content: center; align-items: center;
            z-index: 2147483647 !important;
            color: white;
            font-family: 'Poppins', sans-serif;
            text-align: center;
        `;
        overlay.innerHTML = `
            <div style="font-size:28px; font-weight:600; margin-bottom:20px;">Bypassing Lootlinks...</div>
            <div style="width:60px;height:60px;border:6px solid rgba(255,255,255,0.2);border-top:6px solid #00c3ff;border-radius:50%;animation:spin 1s linear infinite;"></div>
            <div id="kxBypass-timer" style="margin-top:20px;font-size:18px;">Estimated time left: 40s</div>
        `;
        document.body.appendChild(overlay);

        const style = document.createElement("style");
        style.textContent = `
            @keyframes spin {0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}
            #kxBypass-overlay button {padding:12px 24px;background:#00c3ff;color:white;border:none;border-radius:8px;font-size:16px;cursor:pointer;transition:background 0.2s;}
            #kxBypass-overlay button:hover {background:#0090c3;}
        `;
        document.head.appendChild(style);

        let seconds = 60;
        const timerEl = overlay.querySelector("#kxBypass-timer");
        countdownInterval = setInterval(() => {
            seconds--;
            if(seconds > 0){
                timerEl.textContent = `Estimated time left: ${seconds}s`;
                document.title = `⏳ ${seconds}s left`;
            } else {
                timerEl.textContent = `Almost done...`;
                document.title = `Almost done!`;
                clearInterval(countdownInterval);
            }
        }, 1000);

        return overlay;
    }

    function showSuccess(destinationUrl){
        const overlay = createOverlay();
        clearInterval(countdownInterval);
        document.title = "✅ Bypass Complete";
        overlay.innerHTML = `
            <div style="font-size:28px; font-weight:600; color:#2ecc71; margin-bottom:20px;">Bypass Successful!</div>
            <div style="font-size:16px; margin-bottom:20px; max-width:80%; word-break:break-all;">${destinationUrl}</div>
            <button id="kxBypass-btn">Continue to Link</button>
            <div style="margin-top:10px; font-size:14px; color:#aaa;">Auto redirecting in 3 seconds...</div>
        `;
        overlay.querySelector("#kxBypass-btn").onclick = () => window.location.href = destinationUrl;
        setTimeout(() => window.location.href = destinationUrl, 3000);
    }

    function showError(message){
        const overlay = createOverlay();
        clearInterval(countdownInterval);
        document.title = "❌ Bypass Failed";
        overlay.innerHTML = `
            <div style="font-size:28px; font-weight:600; color:#e74c3c; margin-bottom:20px;">Error Occurred</div>
            <div style="font-size:16px; margin-bottom:20px; max-width:80%; word-break:break-all;">${message}</div>
            <div style="font-size:14px;color:#aaa;">Check console for details</div>
        `;
    }

    // --- Decode function (original XOR/Base64) ---
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

    // --- Main Bypass Logic ---
    function handleLootlinks() {
        const originalFetch = window.fetch;
        window.fetch = async function (...args) {
            const [resource] = args;
            const url = typeof resource === "string" ? resource : resource.url;

            if(url.includes("/tc")){
                try{
                    const response = await originalFetch(...args);
                    const data = await response.clone().json();

                    if(Array.isArray(data) && data.length > 0){
                        const { urid, task_id, action_pixel_url, session_id } = data[0];
                        const shard = parseInt(urid.slice(-5)) % 3;

                        const ws = new WebSocket(
                            `wss://${shard}.${INCENTIVE_SERVER_DOMAIN}/c?uid=${urid}&cat=${task_id}&key=${KEY}&session_id=${session_id}&is_loot=1&tid=${TID}`
                        );

                        ws.onopen = () => setInterval(()=>ws.send("0"),1000);
                        ws.onmessage = (e)=>{
                            if(e.data.startsWith("r:")){
                                const encoded = e.data.slice(2);
                                try{
                                    const destinationUrl = decodeURI(encoded);
                                    setTimeout(()=>showSuccess(destinationUrl),2000);
                                }catch(err){
                                    console.error("Decryption error:",err);
                                    showError("Failed to decrypt URL");
                                }
                            }
                        };

                        // Send beacons and pixel fetches
                        navigator.sendBeacon(`https://${shard}.${INCENTIVE_SERVER_DOMAIN}/st?uid=${urid}&cat=${task_id}`);
                        fetch(`https:${action_pixel_url}`);
                        fetch(`https://${INCENTIVE_SYNCER_DOMAIN}/td?ac=auto_complete&urid=${urid}&cat=${task_id}&tid=${TID}`);
                    }
                    return response;
                }catch(err){
                    console.error("Bypass fetch error:",err);
                    showError("Bypass failed - try again");
                    return originalFetch(...args);
                }
            }
            return originalFetch(...args);
        };

        window.open = () => null;
    }

    // --- Start immediately ---
    window.addEventListener("load", ()=>{
        console.log("Page loaded, starting Lootlinks bypass immediately...");
        createOverlay();
        handleLootlinks();
    });

})();
