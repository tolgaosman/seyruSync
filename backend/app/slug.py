"""Marka/model adlarını karşılaştırılabilir slug'a çevirir.
Frontend'deki tutarsızlığı (yerel JSON büyük/küçük harfe duyarsız arıyor,
FALLBACK_MODELS duyarlı arıyor) kaynağında çözer."""

import re
import unicodedata


def slugify(name: str) -> str:
    normalized = unicodedata.normalize("NFKD", name)
    ascii_only = normalized.encode("ascii", "ignore").decode("ascii")
    lowered = ascii_only.lower().strip()
    return re.sub(r"[^a-z0-9]+", "-", lowered).strip("-")
