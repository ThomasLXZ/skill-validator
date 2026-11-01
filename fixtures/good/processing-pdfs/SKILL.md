---
name: processing-pdfs
description: Extracts text and tables from PDF files, fills PDF forms, and merges multiple PDFs. Use when working with PDF documents or when the user mentions PDFs, forms, or document extraction.
license: Apache-2.0
metadata:
  author: example-org
  version: "1.0"
---

# PDF Processing

## Quick start

Install the dependency first: `pip install pypdf`

Extract text:

```python
from pypdf import PdfReader
reader = PdfReader("file.pdf")
text = reader.pages[0].extract_text()
```

## Filling forms

1. Run `python scripts/fill_form.py input.pdf fields.json output.pdf`
2. Check the output opens correctly.

For field mapping details, see [the forms guide](references/FORMS.md).

## Edge cases

- Scanned PDFs have no text layer; tell the user OCR is needed.
