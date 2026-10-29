"""Streamlit entry point that hosts the existing Dino Quest browser game."""

from pathlib import Path

import streamlit as st


ROOT = Path(__file__).resolve().parent


def build_game_document() -> str:
    """Inline local assets so the game runs together inside one iframe."""
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    css = (ROOT / "style.css").read_text(encoding="utf-8")
    questions = (ROOT / "questions.js").read_text(encoding="utf-8")
    game_script = (ROOT / "script.js").read_text(encoding="utf-8")

    html = html.replace(
        '<link rel="stylesheet" href="style.css">',
        f"<style>\n{css}\n</style>",
    )
    html = html.replace(
        '<script src="questions.js"></script>',
        f"<script>\n{questions}\n</script>",
    )
    html = html.replace(
        '<script src="script.js"></script>',
        f"<script>\n{game_script}\n</script>",
    )
    return html


st.set_page_config(page_title="Dino Quest", page_icon="🦖", layout="wide")
st.markdown(
    """
    <style>
      [data-testid="stHeader"], [data-testid="stToolbar"], footer { display: none; }
      .block-container { max-width: 100%; padding: 0 !important; }
    </style>
    """,
    unsafe_allow_html=True,
)
st.iframe(build_game_document(), height=1180, width="stretch")
