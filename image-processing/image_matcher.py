import torch
from PIL import Image
from pathlib import Path
from model import processor, model


def get_embedding(image_path):
    # Open the image
    image = Image.open(image_path).convert("RGB")

    # Prepare image for DINOv2
    inputs = processor(images=image, return_tensors="pt")

    # Generate embedding
    with torch.no_grad():
        outputs = model(**inputs)

    # Take the CLS token as the image embedding
    embedding = outputs.last_hidden_state[:, 0, :]

    # Normalize the embedding
    embedding = torch.nn.functional.normalize(embedding, p=2, dim=1)

    return embedding


# Test the function
image_path = next(Path("images").iterdir())

embedding = get_embedding(image_path)

print("Embedding generated successfully!")
print("Embedding shape:", embedding.shape)