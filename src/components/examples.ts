export const EXAMPLES: Record<string, { label: string; text: string }> = {
  good: {
    label: "Good example",
    text: `---
name: processing-pdfs
description: Extracts text and tables from PDF files, fills PDF forms, and merges multiple PDFs. Use when working with PDF documents or when the user mentions PDFs, forms, or document extraction.
---

# PDF Processing

## Quick start

Install the dependency first: \`pip install pypdf\`

1. Run \`python scripts/fill_form.py input.pdf fields.json output.pdf\`
2. For field mapping details, see [the forms guide](references/FORMS.md).

## Edge cases

- Scanned PDFs have no text layer; tell the user OCR is needed.
`,
  },
  bad: {
    label: "Broken example",
    text: `---
name: Claude_PDF--Helper
description: I can help with documents
version: 1.0
---

Do whatever the user wants with PDFs. If you're doing this before August 2025, use the old API.
Save output to C:\\Users\\me\\out.txt
`,
  },
};
