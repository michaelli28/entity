"""Generate small PDF fixtures for RAG parsing tests.

Run once to (re)build the fixture PDFs committed to the repo:
    uv run python -m tests.fixtures.rag.make_fixtures
"""
from pathlib import Path

from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

_HERE = Path(__file__).parent


def _build_sectioned_pdf(path: Path) -> None:
    """PDF with clearly-marked academic sections."""
    c = canvas.Canvas(str(path), pagesize=letter)

    def line(text: str, y: int, size: int = 11) -> None:
        c.setFont("Helvetica", size)
        c.drawString(72, y, text)

    line("A Tiny Paper About Founders", 750, size=14)
    line("Jane Researcher (jane@example.edu)", 730)
    line("", 710)
    line("Abstract", 690, size=12)
    line("This paper studies founder persistence. We find grit predicts outcomes.", 670)
    line("", 650)
    line("Introduction", 630, size=12)
    line("Entrepreneurship research has long debated what predicts success.", 610)
    line("We build on prior work to investigate founder-level signals.", 590)
    c.showPage()

    line("Method", 750, size=12)
    line("We surveyed 200 founders and coded their verbal responses.", 730)
    line("", 710)
    line("Results", 690, size=12)
    line("Persistence scores correlated r=0.42 with five-year survival.", 670)
    line("", 650)
    line("Discussion", 630, size=12)
    line("Findings suggest investors should weight founder grit highly.", 610)
    c.save()


def _build_flat_pdf(path: Path) -> None:
    """PDF with no detectable section headers (single blob of prose)."""
    c = canvas.Canvas(str(path), pagesize=letter)
    c.setFont("Helvetica", 11)
    y = 750
    for line_text in [
        "Some informal reflections on entrepreneurship.",
        "No section headers appear anywhere in this document.",
        "It is a single blob of continuous prose for fallback testing.",
    ]:
        c.drawString(72, y, line_text)
        y -= 20
    c.save()


def main() -> None:
    _build_sectioned_pdf(_HERE / "sectioned.pdf")
    _build_flat_pdf(_HERE / "flat.pdf")
    print(f"Wrote fixtures to {_HERE}")


if __name__ == "__main__":
    main()
