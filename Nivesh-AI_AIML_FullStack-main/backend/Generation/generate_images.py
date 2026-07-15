import requests
import os
import time

API_TOKEN = os.getenv("API_TOKEN")
API_URL = os.getenv("API_URL")


headers = {"Authorization": f"Bearer {API_TOKEN}"}

prompts = [
    "Indian family opening a bank account illustration",
    "Digital banking and UPI payment illustration",
    "Financial inclusion government scheme illustration"
]

os.makedirs("images", exist_ok=True)

for i, prompt in enumerate(prompts, start=1):
    print(f"Generating image {i}...")
    response = requests.post(
        API_URL,
        headers=headers,
        json={"inputs": prompt}
    )

    content_type = response.headers.get("content-type", "")

    if "image" in content_type:
        with open(f"images/img{i}.png", "wb") as f:
            f.write(response.content)
        print(f"Image img{i}.png saved")
    else:
        print("Model busy or error response:")
        print(response.text)
        print("Waiting 15 seconds and retrying...")
        time.sleep(15)
