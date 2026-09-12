from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import pyttsx3
import threading

app = Flask(__name__)
CORS(app)

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "gemma3:1b"


# ==========================================
# NOVA PERSONALITY
# ==========================================

NOVA_SYSTEM_PROMPT = """
You are NOVA, a personal AI assistant.

You were created by D.N. Maadesh.

Your personality:
- Friendly
- Intelligent
- Calm
- Futuristic
- Helpful
- Confident
- Natural and conversational

Answer clearly and directly.

Do not constantly mention that you are an AI.

Do not say you are ChatGPT.

Your name is NOVA.

For simple questions, give concise answers.

For technical questions, give step-by-step instructions.

If the user asks who created you, say:
"I was created by D.N. Maadesh."
"""


# ==========================================
# HOME
# ==========================================

@app.route("/")
def home():

    return "NOVA backend is running!"


# ==========================================
# CHAT
# ==========================================

@app.route("/chat", methods=["POST"])
def chat():

    data = request.get_json()

    user_message = data.get(
        "message",
        ""
    ).strip()

    if not user_message:

        return jsonify({
            "error": "No message received"
        }), 400


    prompt = f"""
{NOVA_SYSTEM_PROMPT}

USER:
{user_message}

NOVA:
"""


    try:

        response = requests.post(

            OLLAMA_URL,

            json={
                "model": MODEL,
                "prompt": prompt,
                "stream": False
            },

            timeout=120
        )


        response.raise_for_status()


        result = response.json()


        nova_reply = result.get(
            "response",
            ""
        )


        return jsonify({

            "reply": nova_reply

        })


    except requests.exceptions.ConnectionError:

        return jsonify({

            "error":
            "Ollama is not running. Please start Ollama."

        }), 500


    except requests.exceptions.Timeout:

        return jsonify({

            "error":
            "NOVA took too long to respond."

        }), 500


    except Exception as e:

        return jsonify({

            "error": str(e)

        }), 500


# ==========================================
# TEXT TO SPEECH
# ==========================================

def speak_text(text):

    try:

        engine = pyttsx3.init()

        voices = engine.getProperty(
            "voices"
        )


        # Find Microsoft Zira

        for voice in voices:

            if "Zira" in voice.name:

                engine.setProperty(
                    "voice",
                    voice.id
                )

                print(
                    "NOVA voice: Microsoft Zira"
                )

                break


        # Average-slow speaking speed

        engine.setProperty(
            "rate",
            155
        )


        # Full volume

        engine.setProperty(
            "volume",
            1.0
        )


        engine.say(text)

        engine.runAndWait()

        engine.stop()


    except Exception as e:

        print(
            "TTS ERROR:",
            e
        )


# ==========================================
# SPEAK ENDPOINT
# ==========================================

@app.route(
    "/speak",
    methods=["POST"]
)
def speak():

    data = request.get_json()

    text = data.get(
        "text",
        ""
    ).strip()


    if not text:

        return jsonify({

            "error":
            "No text received"

        }), 400


    # Speak in background

    speech_thread = threading.Thread(

        target=speak_text,

        args=(text,)

    )

    speech_thread.daemon = True

    speech_thread.start()


    return jsonify({

        "status":
        "speaking"

    })


# ==========================================
# START NOVA
# ==========================================

if __name__ == "__main__":

    print("")

    print(
        "================================"
    )

    print(
        "        NOVA BACKEND"
    )

    print(
        "================================"
    )

    print(
        "NOVA is running at:"
    )

    print(
        "http://127.0.0.1:5000"
    )

    print(
        "================================"
    )

    print("")


    app.run(

        host="127.0.0.1",

        port=5000,

        debug=True

    )