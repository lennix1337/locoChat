// locoChat.js
// Loco Chat - Funcionalidade de clique nos usuários copiados

let currentAvatar = "https://static.getloconow.com/thumbnail/rescaled/users/9EJ4S6V4F6cb416cc5-ec3b-4d49-9c9c-ce4927cf9093.jpeg";
let autoScrollEnabled = true;
let displayedMessages = new Set();
let copiedUsers = new Map(); // username -> { avatar, color }
let CHAT_URL = null;
let currentStreamer = "yodasl";
let fetchInterval = null;
let currentStreamUid = null; // para buscar stickers dinamicamente
let cachedStickers = null;   // cache dos stickers do streamer atual
/**
 * Busca o image_url do sticker, extrai o base64 de assets[0].p e retorna como data URL.
 * Retorna null em caso de erro.
 */

// UID do usuário (carregado do .env)
let USER_UID = null;
async function loadEnvVars() {
    try {
        // Primeiro tenta carregar do localStorage
        const localUid = getEnvVariable('UID');
        if (localUid) {
            USER_UID = localUid;
            return;
        }
        // Se não houver no localStorage, tenta carregar do .env
        const res = await fetch('.env');
        if (!res.ok) return;
        const text = await res.text();
        const lines = text.split('\n');
        for (const line of lines) {
            const match = line.match(/^\s*UID\s*=\s*(.+)\s*$/);
            if (match) {
                USER_UID = match[1].trim();
                break;
            }
        }
    } catch (e) {
        console.warn("Não foi possível carregar .env:", e);
    }
}
window.addEventListener('DOMContentLoaded', loadEnvVars);
async function fetchStickerBase64(imageUrl) {
    try {
        const res = await fetch(imageUrl, { method: "GET" });
        if (res.ok) {
            const json = await res.json();
            if (json.assets && json.assets[0] && json.assets[0].p) {
                return json.assets[0].p;
            }
        }
    } catch (e) {
        console.error("Erro ao buscar/converter sticker:", e);
    }
    return null;
}

// Cor padrão do usuário para envio (mas exibição usa profile.color do backend)
const userColor = "#3312ff";

// Load environment variables from localStorage or directly use them
function getEnvVariable(key) {
    return localStorage.getItem(`locoChat.${key.toLowerCase()}`);
}

// Headers editáveis pelo usuário (persistidos em localStorage)
function getUserHeaders() {
    return {
        authorization: getEnvVariable('AUTHORIZATION'),
        clientId: getEnvVariable('X_CLIENT_ID'),
        clientSecret: getEnvVariable('X_CLIENT_SECRET'),
        uid: getEnvVariable('UID')
    };
}

function setUserHeaders({ authorization, clientId, clientSecret, uid }) {
    localStorage.setItem("locoChat.authorization", authorization || "");
    localStorage.setItem("locoChat.clientId", clientId || "");
    localStorage.setItem("locoChat.clientSecret", clientSecret || "");
    localStorage.setItem("locoChat.uid", uid || "");
    // Atualiza USER_UID em tempo real
    if (uid) USER_UID = uid;
}

// Monta os headers para requisições ao chat (sem "priority")
function buildHeaders() {
    const userHeaders = getUserHeaders();
    return {
        "accept": "*/*",
        "authorization": userHeaders.authorization,
        "content-type": "application/json",
        "x-client-id": userHeaders.clientId,
        "x-client-secret": userHeaders.clientSecret,
        "x-platform": "7",
        "x-app-lang": "en",
        "x-app-locale": "pt-BR",
        "accept-language": "pt-BR,pt;q=0.9,en;q=0.8,nl;q=0.7",
        "sec-ch-ua": "\"Google Chrome\";v=\"135\", \"Not-A.Brand\";v=\"8\", \"Chromium\";v=\"135\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "cross-site"
    };
}

// Pausa scroll automático ao passar mouse sobre qualquer área do chat
window.addEventListener('DOMContentLoaded', () => {
    const chatContainer = document.getElementById('chatContainer');
    const chatPausedNotice = document.getElementById('chatPausedNotice');
    if (chatContainer) {
        chatContainer.addEventListener('mouseenter', () => {
            autoScrollEnabled = false;
            if (chatPausedNotice) {
                chatPausedNotice.textContent = "Chat pausado temporariamente enquanto o mouse está sobre o chat.";
                chatPausedNotice.style.display = "block";
                chatPausedNotice.style.background = "#f1f5f9";
                chatPausedNotice.style.color = "#64748b";
                chatPausedNotice.style.fontSize = "0.93em";
                chatPausedNotice.style.padding = "4px 0";
                chatPausedNotice.style.borderRadius = "6px";
                chatPausedNotice.style.marginBottom = "4px";
                chatPausedNotice.style.textAlign = "center";
                chatPausedNotice.style.boxShadow = "0 1px 4px #e2e8f0";
                chatPausedNotice.style.fontWeight = "400";
            }
        });
        chatContainer.addEventListener('mouseleave', () => {
            autoScrollEnabled = true;
            chatContainer.scrollTop = chatContainer.scrollHeight;
            if (chatPausedNotice) {
                chatPausedNotice.style.display = "none";
            }
        });
    }
});

function buildStickerHeaders() {
    const userHeaders = getUserHeaders();
    return {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:137.0) Gecko/20100101 Firefox/137.0",
        "Accept": "*/*",
        "Accept-Language": "pt-BR,pt;q=0.8,en-US;q=0.5,en;q=0.3",
        "X-APP-LANG": "en",
        "X-APP-LOCALE": "en-US",
        "Authorization": userHeaders.authorization,
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "cross-site",
        "Cache-Control": "no-cache"
    };
}

function showChatError(msg) {
    let errorDiv = document.getElementById('chatError');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'chatError';
        errorDiv.style.background = '#ff3b3b';
        errorDiv.style.color = 'white';
        errorDiv.style.padding = '10px';
        errorDiv.style.marginBottom = '10px';
        errorDiv.style.borderRadius = '4px';
        errorDiv.style.fontWeight = 'bold';
        errorDiv.style.textAlign = 'center';
        const chatContainer = document.getElementById('chatContainer');
        chatContainer.parentNode.insertBefore(errorDiv, chatContainer);
    }
    errorDiv.textContent = msg;
    errorDiv.style.display = 'block';
}

function hideChatError() {
    const errorDiv = document.getElementById('chatError');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}

function $id(id) {
    return document.getElementById(id);
}

async function fetchStickers(streamUid) {
    const streamer_uid = "0X7HCUVLC9";
    const game_uid = "568925";
    const tab_key = "40";
    const limit = 40;
    const url = `https://yen.getloconow.com/v2/sticker/all/?stream_uid=${streamUid}&streamer_uid=${streamer_uid}&game_uid=${game_uid}&tab_key=${tab_key}&limit=${limit}`;
    try {
        const response = await fetch(url, {
            method: "GET",
            headers: buildStickerHeaders(),
            referrer: "https://loco.com/",
            mode: "cors"
        });
        console.log('Response status:', response.status);
        if (!response.ok) {
            console.error('Failed to fetch stickers:', response.statusText);
            return [];
        }
        const data = await response.json();
        console.log('Received data:', data);
        
        if (data.results && data.results.length > 0) {
            // For each sticker, fetch its imageUrl and extract assets.p (base64)
            const stickers = await Promise.all(
                data.results.map(async sticker => {
                    let base64 = '';
                    try {
                        const imgRes = await fetch(sticker.image_url, { method: "GET" });
                        if (imgRes.ok) {
                            const imgJson = await imgRes.json();
                            base64 = imgJson.assets[0].p;
                        }
                    } catch (e) {
                        console.error('Error fetching sticker image:', e);
                    }
                    return {
                        name: sticker.name,
                        imageUrl: sticker.image_url,
                        base64
                    };
                })
            );
            console.log('Extracted stickers with base64:', stickers);
            return stickers;
        }
        
        console.log('No valid sticker data found');
        return [];
    } catch (e) {
        console.error('Error fetching stickers:', e);
        return [];
    }
}

function renderStickers() {
    const stickersList = $id('stickersList');
    stickersList.innerHTML = '';
    if (!cachedStickers || cachedStickers.length === 0) {
        stickersList.innerHTML = '<span style="color:#aaa;">Nenhum sticker disponível.</span>';
        return;
    }

    cachedStickers.forEach(sticker => {
        const img = document.createElement('img');
        img.src = sticker.base64 && sticker.base64.startsWith('data:image') ? sticker.base64 : sticker.imageUrl;
        img.onerror = () => {
            console.error('Failed to load sticker image:', sticker.imageUrl);
            img.src = 'fallback-image-url.png'; // Optional fallback image
        };
        img.alt = sticker.name;
        img.title = sticker.name;
        img.style.width = "40px";
        img.style.height = "40px";
        img.style.cursor = "pointer";
        img.onclick = () => {
            navigator.clipboard.writeText(`data:image/png;base64,${sticker.base64}`);
        };
        stickersList.appendChild(img);
    });
}

function renderCopiedUsers() {
    const list = $id('copiedUsersList');
    list.innerHTML = '';
    copiedUsers.forEach((data, username) => {
        const li = document.createElement('li');
        li.style.display = "flex";
        li.style.alignItems = "center";
        li.style.gap = "8px";
        li.style.marginBottom = "6px";
        li.innerHTML = `
            <img src="${data.avatar}" alt="avatar" style="width:24px;height:24px;border-radius:50%;">
            <span style="color:${data.color};font-weight:600;cursor:pointer;" onclick="applyCopiedUser('${username}', '${data.avatar}', '${data.color}');">${username}</span>
        `;
        list.appendChild(li);
    });
}

function applyCopiedUser(username, avatar, color) {
    $id('usernameInput').value = username;
    currentAvatar = avatar;
    // Opcional: também pode mudar a cor do input ou exibir um aviso de que o perfil foi alterado
}

async function fetchStreamerId(streamerName) {
    try {
        const url = `https://loco.com/streamers/${encodeURIComponent(streamerName)}`;
        const response = await fetch(url, { credentials: "omit" });
        if (response.status === 401) {
            showChatError("Erro 401: Não autorizado ao buscar o streamer id. Tente novamente mais tarde.");
            return null;
        }
        const html = await response.text();
        const seoVideosMatch = html.match(/"seo_videos":\[\{"uid":"([a-f0-9\-]+)"/i);
        if (seoVideosMatch && seoVideosMatch[1]) {
            return seoVideosMatch[1];
        }
        const match = html.match(/"streamerId"\s*:\s*"([a-f0-9\-]+)"/i) ||
                      html.match(/"id"\s*:\s*"([a-f0-9\-]+)"/i);
        if (match && match[1]) {
            return match[1];
        }
        const fallback = html.match(/data-streamer-id\s*=\s*"([a-f0-9\-]+)"/i);
        if (fallback && fallback[1]) {
            return fallback[1];
        }
        showChatError("Streamer id (uid de seo_videos) não encontrado no HTML.");
        return null;
    } catch (err) {
        showChatError("Erro ao buscar streamer id: " + err.message);
        return null;
    }
}

async function fetchMessages() {
    if (!CHAT_URL) return;
    try {
        const response = await fetch(`${CHAT_URL}?get=true`, {
            headers: buildHeaders(),
            credentials: "include"
        });
        if (response.status === 401) {
            showChatError("Erro 401: Não autorizado ao buscar mensagens do chat.");
            return;
        }
        hideChatError();
        const data = await response.json();
        if (data.chats) {
            const sortedChats = data.chats.sort((a, b) => a.data.msg_time - b.data.msg_time);
            for (const chat of sortedChats) {
                const msgData = chat.data;
                const uniqueId = getMessageUniqueId(msgData);
                displayedMessages.add(uniqueId);
                await addMessageToChat(msgData);
            }

            // Moderadores online (últimos 5 minutos)
            const FIVE_MINUTES = 5 * 60 * 1000;
            const now = Date.now();
            const modSet = new Set();
            if (data.chats) {
                for (const chat of data.chats) {
                    const msgData = chat.data;
                    if (
                        msgData.moderator_type > 0 &&
                        msgData.profile &&
                        msgData.profile.username &&
                        (now - msgData.msg_time < FIVE_MINUTES)
                    ) {
                        modSet.add(msgData.profile.username);
                    }
                }
            }
            const modCount = modSet.size;
            // ModBot symbol: 🛡️ (can be replaced with SVG if desired)
            const modCountEl = document.getElementById('modCount');
            if (modCountEl) {
                if (modCount > 0) {
                    modCountEl.innerHTML = `<span style="display:inline-flex;align-items:center;gap:2px;"><span style="font-size:1.2em;">🛡️</span> <span>${modCount}</span></span>`;
                } else {
                    modCountEl.innerHTML = '';
                }
            }
        }
    } catch (error) {
        showChatError("Erro ao buscar mensagens do chat: " + error.message);
    }
}

function getMessageUniqueId(msgData) {
    // Usa msgId se não vazio, senão combina client_msg_time e deviceId
    if (msgData.msgId && msgData.msgId.trim() !== "") {
        return msgData.msgId;
    }
    return `${msgData.client_msg_time || ""}-${msgData.deviceId || ""}`;
}

async function addMessageToChat(msgData) {
    const container = $id('chatContainer');
    const uniqueId = getMessageUniqueId(msgData);
    if (container.querySelector(`[data-msg-id="${uniqueId}"]`)) return;

    // Usa profile.color do backend, fallback para #fff se vazio/nulo
    let userColor = "#fff";
    if (msgData.profile && typeof msgData.profile.color === "string" && msgData.profile.color.trim()) {
        userColor = msgData.profile.color;
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    messageDiv.dataset.msgId = uniqueId;

    // Detecta sticker
    const isSticker = msgData.sticker && msgData.sticker.image_url;

    let messageContentHTML = "";
    if (isSticker) {
        // Renderização de sticker
        const sticker = msgData.sticker;
        let stickerBg = sticker.background_color || "#222";
        let stickerAmount = sticker.amount ? `<span class="sticker-amount">x${sticker.amount}</span>` : "";
        let stickerAnimClass = sticker.is_animated ? "sticker-animated" : "sticker-static";
        // Exibe nome do usuário
        let usernameHTML = `<span class="username" style="color: ${userColor}; font-weight: bold; margin-right: 6px;">${msgData.profile.username}:</span>`;

        // Placeholder enquanto carrega
        messageContentHTML = `
            <div class="sticker-container" style="padding:8px;display:inline-flex;align-items:center;gap:8px;">
                ${usernameHTML}
                <div class="sticker-img-loading" style="width:64px;height:64px;background:#444;display:flex;align-items:center;justify-content:center;">
                    <span style="color:#fff;font-size:12px;">...</span>
                </div>
                ${stickerAmount}
            </div>
        `;
    } else {
        // Renderização padrão de texto
        messageContentHTML = `
            <span class="username-row" style="color: ${userColor}; font-weight: bold;">
                ${msgData.profile.username}
            </span>
            <span class="message-text">${msgData.message}</span>
        `;
    }

    messageDiv.innerHTML = `
        <button class="copy-profile-btn"
            data-username="${msgData.profile.username}"
            data-avatar="${msgData.profile.avatar}"
            data-color="${userColor}">
            ⚡
        </button>
        <img src="${msgData.profile.avatar}" class="avatar" alt="Avatar">
        <div class="message-content">
            ${messageContentHTML}
        </div>
    `;
    container.appendChild(messageDiv);

    // Se for sticker, busca o base64 e atualiza a imagem
    if (isSticker) {
        const sticker = msgData.sticker;
        let stickerImgSrc = await fetchStickerBase64(sticker.image_url);
        if (!stickerImgSrc) stickerImgSrc = sticker.image_url; // fallback para URL original
        let stickerAnimClass = sticker.is_animated ? "sticker-animated" : "sticker-static";
        // Atualiza só a imagem do sticker, mantendo o nome do usuário
        const stickerContainer = messageDiv.querySelector('.sticker-container');
        if (stickerContainer) {
            let usernameHTML = `<span class="username" style="color: ${userColor}; font-weight: bold; margin-right: 6px;">${msgData.profile.username}:</span>`;
            stickerContainer.innerHTML = `
                ${usernameHTML}
                <img src="${stickerImgSrc}" class="sticker-img ${stickerAnimClass}" alt="Sticker" style="max-width:64px;max-height:64px;display:block;">
                ${sticker.amount ? `<span class="sticker-amount">x${sticker.amount}</span>` : ""}
            `;
        }
    }

    // Dispara animação suave ao adicionar nova mensagem
    requestAnimationFrame(() => {
        messageDiv.classList.add('message-animate');
    });

    // Só faz scroll automático se permitido
    if (autoScrollEnabled) {
        container.scrollTop = container.scrollHeight;
    }

    // Store message in LocalStorage
    storeMessageInLocalStorage(msgData);
}

// Function to store message in LocalStorage
function storeMessageInLocalStorage(msgData) {
    const key = `chatMessages_${currentStreamUid || 'default'}`;
    const storedMessages = JSON.parse(localStorage.getItem(key)) || [];
    storedMessages.push(msgData);
    // Limit the number of messages to 100
    if (storedMessages.length > 100) {
        storedMessages.shift();
    }
    localStorage.setItem(key, JSON.stringify(storedMessages));
}

async function sendMessage() {
    if (!USER_UID) {
        showChatError("UID não configurado. Defina seu UID no arquivo .env ou no modal de configurações.");
        return;
    }
    if (!CHAT_URL) return;
    const messageInput = $id('messageInput');
    const msg = messageInput.value.trim();
    if (!msg) return;

    const sendBtn = $id('sendBtn');
    sendBtn.disabled = true;

    try {
        const response = await fetch(`${CHAT_URL}?send=true`, {
            method: "POST",
            headers: buildHeaders(),
            referrer: "https://loco.com/",
            referrerPolicy: "strict-origin-when-cross-origin",
            body: JSON.stringify({
                message: msg,
                msgId: crypto.randomUUID(),
                deviceId: "ce2e272326c953cfb0b8c2f1340111e3live-93581c7a-bd20-4d7",
                msg_time: Date.now(),
                moderator_type: 0,
                profile: {
                    avatar: currentAvatar,
                    color: userColor,
                    uid: USER_UID,
                    username: $id('usernameInput').value
                },
                type: 1
            }),
            mode: "cors",
            credentials: "include"
        });

        if (response.status === 401) {
            showChatError("Erro 401: Não autorizado ao enviar mensagem.");
            return;
        }
        hideChatError();
        if (response.ok) {
            messageInput.value = '';
            fetchMessages();
        }
    } catch (error) {
        showChatError("Erro ao enviar mensagem: " + error.message);
    } finally {
        sendBtn.disabled = false;
    }
}

function resetProfile() {
    $id('usernameInput').value = 'default_username';
    currentAvatar = "https://static.getloconow.com/loco-avatars/57b458f2b7b64e5e957f20866cf66a56.png";
}

function clearChat() {
    const container = $id('chatContainer');
    container.innerHTML = '';
    displayedMessages = new Set();
    hideChatError();
}

function setupEventListeners() {
    $id('messageInput').addEventListener('keypress', e => {
        if (e.key === 'Enter') sendMessage();
    });

    $id('chatContainer').addEventListener('click', e => {
        const btn = e.target.closest('.copy-profile-btn');
        if (btn) {
            $id('usernameInput').value = btn.dataset.username;
            currentAvatar = btn.dataset.avatar;
            copiedUsers.set(btn.dataset.username, {
                avatar: btn.dataset.avatar,
                color: btn.dataset.color
            });
            renderCopiedUsers();
        }
    });

    $id('sendBtn').addEventListener('click', sendMessage);
    $id('resetProfileBtn').addEventListener('click', resetProfile);

    $id('changeStreamerBtn').addEventListener('click', () => {
        const newStreamer = $id('streamerInput').value.trim();
        if (newStreamer && newStreamer !== currentStreamer) {
            currentStreamer = newStreamer;
            reconnectToStreamer();
        }
    });

    // Modal settings
    $id('settingsBtn').addEventListener('click', openSettingsModal);
    $id('closeSettingsBtn').addEventListener('click', closeSettingsModal);
    $id('saveSettingsBtn').addEventListener('click', saveSettingsModal);

    // Painéis colapsáveis
    $id('stickersBtn').addEventListener('click', () => {
        closePanel('copiedUsersPanel');
        openStickersPanel();
    });
    $id('copiedUsersBtn').addEventListener('click', () => {
        closePanel('stickersPanel');
        togglePanel('copiedUsersPanel');
    });
    $id('closeStickersPanel').addEventListener('click', () => closePanel('stickersPanel'));
    $id('closeCopiedUsersPanel').addEventListener('click', () => closePanel('copiedUsersPanel'));
}

function togglePanel(panelId) {
    const panel = $id(panelId);
    panel.style.display = (panel.style.display === 'none' || panel.style.display === '') ? 'block' : 'none';
}
function closePanel(panelId) {
    const panel = $id(panelId);
    panel.style.display = 'none';
}
function openStickersPanel() {
    $id('stickersPanel').style.display = 'block';
    renderStickers();
}

async function reconnectToStreamer() {
    clearChat();
    if (fetchInterval) {
        clearInterval(fetchInterval);
        fetchInterval = null;
    }
    await initChat();
}

async function initChat() {
    renderCopiedUsers();
    const streamerId = await fetchStreamerId(currentStreamer);
    if (!streamerId) {
        return;
    }
    CHAT_URL = `https://chat.getloconow.com/v2/streams/${streamerId}/chat/`;
    currentStreamUid = streamerId;
    // Busca stickers apenas uma vez por streamer
    cachedStickers = await fetchStickers(currentStreamUid);

    // Load stored messages from LocalStorage
    loadStoredMessages();

    fetchMessages();
    fetchInterval = setInterval(fetchMessages, 500);
}

// Function to load stored messages from LocalStorage
async function loadStoredMessages() {
    const key = `chatMessages_${currentStreamUid || 'default'}`;
    const storedMessages = JSON.parse(localStorage.getItem(key)) || [];
    for (const msgData of storedMessages) {
        await addMessageToChat(msgData);
        displayedMessages.add(msgData.msgId);
    }
}

// Modal logic
function openSettingsModal() {
    const { authorization, clientId, clientSecret, uid } = getUserHeaders();
    $id('headerAuthorization').value = authorization;
    $id('headerClientId').value = clientId;
    $id('headerClientSecret').value = clientSecret;
    $id('headerUid').value = uid || USER_UID || "";
    $id('settingsModal').style.display = 'flex';
}
function closeSettingsModal() {
    $id('settingsModal').style.display = 'none';
}
function saveSettingsModal() {
    setUserHeaders({
        authorization: $id('headerAuthorization').value.trim(),
        clientId: $id('headerClientId').value.trim(),
        clientSecret: $id('headerClientSecret').value.trim(),
        uid: $id('headerUid').value.trim()
    });
    closeSettingsModal();
    reconnectToStreamer();
}

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    initChat();
});
