import re
import string

CONTRACTIONS = {
    "what's": "what is",
    "that's": "that is",
    "there's": "there is",
    "can't": "can not",
    "won't": "will not",
    "i'm": "i am",
    "you're": "you are",
    "it's": "it is",
    "we're": "we are",
    "they're": "they are",
    "i've": "i have",
    "you've": "you have",
    "we've": "we have",
    "let's": "let us",
    "who's": "who is",
    "how's": "how is"
}

def normalize_text(text: str) -> str:
    """Preprocesses input text for robust intent classification."""
    if not text:
        return ""
    text = text.lower().strip()
    
    # Expand common contractions
    for contraction, expanded in CONTRACTIONS.items():
        text = re.sub(r'\b' + re.escape(contraction) + r'\b', expanded, text)
        
    # Remove punctuation except alphanumeric characters and spaces
    text = text.translate(str.maketrans("", "", string.punctuation))
    
    # Collapse multiple whitespaces
    text = re.sub(r'\s+', ' ', text).strip()
    return text
