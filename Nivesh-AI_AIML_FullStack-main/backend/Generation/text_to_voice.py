from gtts import gTTS

text = """
प्रधानमंत्री जन धन योजना एक सरकारी योजना है
जो नागरिकों को शून्य बैलेंस बैंक खाते प्रदान करती है।
यह योजना भारत में वित्तीय समावेशन और डिजिटल बैंकिंग को बढ़ावा देती है।
"""

tts = gTTS(
    text=text,
    lang="hi",   # 🔥 Hindi language
    slow=False
)

tts.save("audio/voice.mp3")

print("Hindi voice generated successfully")
