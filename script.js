// ==========================================
// NOVA CHAT SYSTEM
// ==========================================

const messageInput =
    document.getElementById("messageInput");

const sendButton =
    document.getElementById("sendButton");

const voiceButton =
    document.getElementById("voiceButton");

const micButton =
    document.getElementById("micButton");

const messages =
    document.querySelector(".messages");

const newChatButton =
    document.querySelector(".new-chat");

const chatHistory =
    document.querySelector(".chat-history");


// ==========================================
// CHAT STORAGE
// ==========================================

let chats =
    JSON.parse(
        localStorage.getItem("novaChats")
    ) || [];

let currentChatId = null;


// ==========================================
// VOICE SETTINGS
// ==========================================

let voiceEnabled = false;

let recognition = null;

let isListening = false;


// ==========================================
// SAVE CHATS
// ==========================================

function saveChats() {

    localStorage.setItem(
        "novaChats",
        JSON.stringify(chats)
    );

}


// ==========================================
// GET CURRENT CHAT
// ==========================================

function getCurrentChat() {

    return chats.find(
        chat =>
            chat.id === currentChatId
    );

}


// ==========================================
// SHOW WELCOME
// ==========================================

function showWelcome() {

    messages.innerHTML = `

        <div class="welcome">

            <div class="nova-symbol">
                ✦
            </div>

            <h1>
                How can I help you?
            </h1>

            <p>
                I'm NOVA, your AI assistant.
            </p>

        </div>

    `;

}


// ==========================================
// ADD MESSAGE
// ==========================================

function addMessage(text, sender) {

    const messageContainer =
        document.createElement("div");

    messageContainer.classList.add(
        "message",
        sender
    );


    const messageContent =
        document.createElement("div");

    messageContent.classList.add(
        "message-content"
    );


    messageContent.textContent =
        text;


    messageContainer.appendChild(
        messageContent
    );


    messages.appendChild(
        messageContainer
    );


    messages.scrollTop =
        messages.scrollHeight;


    return messageContainer;

}


// ==========================================
// NOVA VOICE OUTPUT
// ==========================================

async function speakNOVA(text) {

    if (!voiceEnabled) {
        return;
    }


    try {

        await fetch(
            "http://127.0.0.1:5000/speak",
            {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    text: text
                })

            }
        );

    }

    catch (error) {

        console.error(
            "NOVA voice error:",
            error
        );

    }

}


// ==========================================
// VOICE OUTPUT BUTTON
// ==========================================

voiceButton.addEventListener(
    "click",
    function() {

        voiceEnabled =
            !voiceEnabled;


        if (voiceEnabled) {

            voiceButton.textContent =
                "🔊";

            voiceButton.classList.add(
                "voice-active"
            );

            voiceButton.title =
                "Voice response ON";

        }

        else {

            voiceButton.textContent =
                "🔇";

            voiceButton.classList.remove(
                "voice-active"
            );

            voiceButton.title =
                "Voice response OFF";

        }

    }
);


// ==========================================
// MICROPHONE / SPEECH RECOGNITION
// ==========================================

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


if (SpeechRecognition) {

    recognition =
        new SpeechRecognition();


    recognition.continuous = false;

    recognition.interimResults = false;

    recognition.lang = "en-US";


    // ======================================
    // MICROPHONE BUTTON
    // ======================================

    micButton.addEventListener(
        "click",
        function() {

            if (isListening) {

                recognition.stop();

                return;

            }


            try {

                recognition.start();

            }

            catch (error) {

                console.error(
                    "Microphone error:",
                    error
                );

            }

        }
    );


    // ======================================
    // START LISTENING
    // ======================================

    recognition.onstart =
        function() {

            isListening = true;


            micButton.textContent =
                "🔴";


            micButton.classList.add(
                "mic-active"
            );


            micButton.title =
                "Listening...";

        };


    // ======================================
    // SPEECH RESULT
    // ======================================

    recognition.onresult =
        function(event) {

            const transcript =
                event.results[0][0].transcript;


            messageInput.value =
                transcript;


            // Automatically send
            // what the user said

            sendMessage();

        };


    // ======================================
    // STOP LISTENING
    // ======================================

    recognition.onend =
        function() {

            isListening = false;


            micButton.textContent =
                "🎤";


            micButton.classList.remove(
                "mic-active"
            );


            micButton.title =
                "Voice input";

        };


    // ======================================
    // MICROPHONE ERROR
    // ======================================

    recognition.onerror =
        function(event) {

            console.error(
                "Speech recognition error:",
                event.error
            );


            isListening = false;


            micButton.textContent =
                "🎤";


            micButton.classList.remove(
                "mic-active"
            );


            micButton.title =
                "Voice input";

        };

}

else {

    // Browser does not support
    // speech recognition

    micButton.disabled = true;

    micButton.textContent =
        "🎤";

    micButton.title =
        "Voice input is not supported in this browser";

}


// ==========================================
// SEND MESSAGE
// ==========================================

async function sendMessage() {

    const message =
        messageInput.value.trim();


    if (message === "") {
        return;
    }


    // ======================================
    // CREATE CHAT IF NEEDED
    // ======================================

    if (!currentChatId) {

        const newChat = {

            id: Date.now(),

            title:
                message.substring(
                    0,
                    30
                ) +
                (
                    message.length > 30
                        ? "..."
                        : ""
                ),

            messages: []

        };


        chats.unshift(
            newChat
        );


        currentChatId =
            newChat.id;

    }


    const currentChat =
        getCurrentChat();


    // ======================================
    // REMOVE WELCOME
    // ======================================

    const welcome =
        document.querySelector(
            ".welcome"
        );


    if (welcome) {
        welcome.remove();
    }


    // ======================================
    // USER MESSAGE
    // ======================================

    addMessage(
        message,
        "user"
    );


    // ======================================
    // SAVE USER MESSAGE
    // ======================================

    currentChat.messages.push({

        sender: "user",

        text: message

    });


    saveChats();

    renderHistory();


    // ======================================
    // CLEAR INPUT
    // ======================================

    messageInput.value = "";


    // ======================================
    // THINKING
    // ======================================

    const thinkingMessage =
        addMessage(
            "NOVA is thinking...",
            "nova"
        );


    try {

        // ==================================
        // SEND TO BACKEND
        // ==================================

        const response =
            await fetch(

                "http://127.0.0.1:5000/chat",

                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            message:
                                message

                        })

                }

            );


        const data =
            await response.json();


        // ==================================
        // REMOVE THINKING
        // ==================================

        if (thinkingMessage) {

            thinkingMessage.remove();

        }


        // ==================================
        // ERROR
        // ==================================

        if (data.error) {

            addMessage(

                "Sorry, I couldn't connect to my AI system.\n\n" +
                data.error,

                "nova"

            );

            return;

        }


        // ==================================
        // SHOW NOVA RESPONSE
        // ==================================

        addMessage(

            data.reply,

            "nova"

        );


        // ==================================
        // SAVE NOVA RESPONSE
        // ==================================

        currentChat.messages.push({

            sender: "nova",

            text: data.reply

        });


        saveChats();


        // ==================================
        // SPEAK ONLY IF ENABLED
        // ==================================

        if (voiceEnabled) {

            speakNOVA(
                data.reply
            );

        }

    }

    catch (error) {

        if (thinkingMessage) {

            thinkingMessage.remove();

        }


        addMessage(

            "I couldn't connect to the NOVA backend.\n\n" +
            "Make sure the Python server is running.",

            "nova"

        );


        console.error(
            "Backend error:",
            error
        );

    }

}


// ==========================================
// RENDER CHAT HISTORY
// ==========================================

function renderHistory() {

    const oldItems =
        chatHistory.querySelectorAll(
            ".history-item"
        );


    oldItems.forEach(
        item => item.remove()
    );


    chats.forEach(
        chat => {

            const button =
                document.createElement(
                    "button"
                );


            button.classList.add(
                "history-item"
            );


            button.textContent =
                chat.title;


            if (
                chat.id ===
                currentChatId
            ) {

                button.classList.add(
                    "active"
                );

            }


            button.addEventListener(
                "click",
                function() {

                    openChat(
                        chat.id
                    );

                }
            );


            chatHistory.appendChild(
                button
            );

        }
    );

}


// ==========================================
// OPEN OLD CHAT
// ==========================================

function openChat(chatId) {

    const chat =
        chats.find(
            item =>
                item.id === chatId
        );


    if (!chat) {
        return;
    }


    currentChatId =
        chat.id;


    messages.innerHTML =
        "";


    chat.messages.forEach(
        message => {

            addMessage(

                message.text,

                message.sender

            );

        }
    );


    if (
        chat.messages.length === 0
    ) {

        showWelcome();

    }


    renderHistory();


    messageInput.focus();

}


// ==========================================
// CREATE NEW CHAT
// ==========================================

function createNewChat() {

    const newChat = {

        id: Date.now(),

        title:
            "New conversation",

        messages: []

    };


    chats.unshift(
        newChat
    );


    currentChatId =
        newChat.id;


    saveChats();


    renderHistory();


    showWelcome();


    messageInput.value = "";


    messageInput.focus();

}


// ==========================================
// NEW CHAT BUTTON
// ==========================================

newChatButton.addEventListener(

    "click",

    function() {

        createNewChat();

    }

);


// ==========================================
// SEND BUTTON
// ==========================================

sendButton.addEventListener(

    "click",

    sendMessage

);


// ==========================================
// ENTER KEY
// ==========================================

messageInput.addEventListener(

    "keydown",

    function(event) {

        if (

            event.key === "Enter" &&
            !event.shiftKey

        ) {

            event.preventDefault();

            sendMessage();

        }

    }

);


// ==========================================
// START NOVA
// ==========================================

function initializeNOVA() {

    renderHistory();


    if (chats.length > 0) {

        openChat(
            chats[0].id
        );

    }

    else {

        showWelcome();

    }

}


initializeNOVA();
