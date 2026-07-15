# from moviepy.video.io.ImageSequenceClip import ImageSequenceClip
# from moviepy.audio.io.AudioFileClip import AudioFileClip
# from PIL import Image, ImageDraw, ImageFont
# import os

# # ------------------------
# # CONFIG
# # ------------------------
# VIDEO_SIZE = (1280, 720)
# OUTPUT_PATH = "video/output_final.mp4"

# subtitles = [
#     "Jan Dhan Yojana",
#     "Zero Balance Bank Accounts",
#     "Financial Inclusion in India"
# ]




# image_files = [
#     "images/img1.jpeg",
#     "images/img2.jpeg",
#     "images/img3.jpeg"
# ]

# # ------------------------
# # LOAD AUDIO FIRST
# # ------------------------
# audio = AudioFileClip("audio/voice.mpeg")

# # Match video length to audio length
# duration_per_image = audio.duration / len(image_files)

# # ------------------------
# # ADD SUBTITLES TO IMAGES
# # ------------------------
# for img_path, text in zip(image_files, subtitles):
#     img = Image.open(img_path).convert("RGB").resize(VIDEO_SIZE)
#     draw = ImageDraw.Draw(img)

#     font = ImageFont.truetype("ARLRDBD.TTF", 60)

#     bbox = draw.textbbox((0, 0), text, font=font)
#     text_w = bbox[2] - bbox[0]
#     text_h = bbox[3] - bbox[1]

#     x = (img.width - text_w) // 2
#     y = img.height - 140

#     draw.rectangle(
#         [(0, y - 30), (img.width, y + text_h + 30)],
#         fill="black"
#     )
#     draw.text((x, y), text, fill="white", font=font)

#     img.save(img_path)

# # ------------------------
# # CREATE VIDEO CLIP
# # ------------------------
# video = ImageSequenceClip(
#     image_files,
#     durations=[duration_per_image] * len(image_files)
# )

# # ------------------------
# # FORCE AUDIO ATTACHMENT
# # ------------------------
# final = video.with_audio(audio)

# # ------------------------
# # WRITE VIDEO (FORCE AUDIO)
# # ------------------------
# # Attach audio (MoviePy 2.x way)
# final = video.with_audio(audio)

# # Force audio muxing
# final.write_videofile(
#     "video/output_final.mp4",
#     fps=24,
#     codec="libx264",
#     audio_codec="aac",
#     temp_audiofile="video/temp_audio.m4a",
#     remove_temp=True
# )

# print("✅ FINAL video created WITH audio stream")


from moviepy.video.io.ImageSequenceClip import ImageSequenceClip
from moviepy.audio.io.AudioFileClip import AudioFileClip
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import sys
import json

BASE_DIR = Path(__file__).resolve().parent

VIDEO_SIZE = (1280, 720)

# ------------------------
# INPUT (dynamic)
# ------------------------
if len(sys.argv) > 1:
    data = json.loads(sys.argv[1])
    subtitles = data["subtitles"]
    image_files = data["images"]
else:
    subtitles = [
        "Jan Dhan Yojana",
        "Zero Balance Bank Accounts",
        "Financial Inclusion in India"
    ]
    image_files = [
        str(BASE_DIR / "images" / "img1.jpeg"),
        str(BASE_DIR / "images" / "img2.jpeg"),
        str(BASE_DIR / "images" / "img3.jpeg")
    ]

audio_path = BASE_DIR / "audio" / "voice.mpeg"
output_path = BASE_DIR / "video" / "output_final.mp4"

# ------------------------
# LOAD AUDIO
# ------------------------
audio = AudioFileClip(str(audio_path))
duration_per_image = audio.duration / len(image_files)

# ------------------------
# DRAW SUBTITLES
# ------------------------
for img_path, text in zip(image_files, subtitles):
    img = Image.open(img_path).convert("RGB").resize(VIDEO_SIZE)
    draw = ImageDraw.Draw(img)

    font = ImageFont.truetype("ARLRDBD.TTF", 60)

    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]

    x = (img.width - text_w) // 2
    y = img.height - 140

    draw.rectangle(
        [(0, y - 30), (img.width, y + text_h + 30)],
        fill="black"
    )

    draw.text((x, y), text, fill="white", font=font)
    img.save(img_path)

# ------------------------
# CREATE VIDEO
# ------------------------
video = ImageSequenceClip(
    image_files,
    durations=[duration_per_image] * len(image_files)
)

final = video.with_audio(audio)

final.write_videofile(
    str(output_path),
    fps=24,
    codec="libx264",
    audio_codec="aac",
    temp_audiofile=str(BASE_DIR / "video" / "temp_audio.m4a"),
    remove_temp=True
)

print("✅ Video generated:", output_path)
