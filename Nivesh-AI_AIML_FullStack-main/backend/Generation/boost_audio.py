from pydub import AudioSegment

# Load original TTS audio
audio = AudioSegment.from_mp3("audio/voice.mp3")

# Boost volume by +15 dB (strong but clean)
louder_audio = audio + 15

# Export boosted audio
louder_audio.export("audio/voice_loud.mp3", format="mp3")

print("Loud audio created: audio/voice_loud.mp3")
