"""
Video Format Registry
=====================
Format-agnostic video rendering formats.
Each format defines how content is transformed into scenes.
"""

from .explainer import EXPLAINER_V1
from .listicle import LISTICLE_V1
from .comparison import COMPARISON_V1
from .narrative import NARRATIVE_V1
from .shorts import SHORTS_V1

FORMAT_REGISTRY = {
    "explainer_v1": EXPLAINER_V1,
    "listicle_v1": LISTICLE_V1,
    "comparison_v1": COMPARISON_V1,
    "narrative_v1": NARRATIVE_V1,
    "shorts_v1": SHORTS_V1,
}

__all__ = ["FORMAT_REGISTRY", "EXPLAINER_V1", "LISTICLE_V1", "COMPARISON_V1", "NARRATIVE_V1", "SHORTS_V1"]

