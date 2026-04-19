# 00-overview — Flow Diagram

**What this folder does (in one line):** sets the stage — vision, glossary, personas, competitors, browser scope.
**User perspective:** a new teammate (or AI model) lands here first to understand *what* we are building and *why*, before reading any code or other folder.

```mermaid
flowchart TD
    A[New reader opens spec] --> B[Reads 01-vision.md]
    B --> C[Checks 02-glossary.md for terms]
    C --> D[Reads 03-personas.md to know the user]
    D --> E[Reads 04-competitive-analysis.md to know the market]
    E --> F[Reads 05-browser-scope.md to know v1 limits]
    F --> G{Understands product?}
    G -- yes --> H[Jumps to 01-information-architecture/]
    G -- no --> B
```

**Plain walkthrough:** Reader → Vision → Glossary → Personas → Competitors → Browser scope → ready to read the rest of the spec.
