# WEB038 — Sacatepéquez municipality catalog V11.1 release

Exact deployed SHA: `6d0984758a511083bf6d8b5ff3028478c0caa37f`
Public URL: `https://media-factory.textilesdemedellin.com`

This release corrects the departmental entry catalog from a tenant-derived list to the exact 16-municipality Sacatepéquez allowlist supplied by the product owner.

It preserves existing municipal data rather than renaming tenants, keeps administrative login compatible without requiring municipality selection, requires municipality selection for self-registration, and lazily creates only the selected missing municipal workspace when a real registration request arrives.

The release was independently verified, reviewed by IBM Granite 3.3 2B (`P/NONE`, 10/10 rubric PASS), cryptographically finalized, reconciled by the controlled host pipeline, and confirmed through public HTTPS probing.
