---
name: Email image rendering
description: Why images vanish in sent emails (admin bulk composer) and the rule for embedding them
---

# Email images must be absolute hosted URLs

Images do not render in delivered emails when they are embedded as **base64 data URIs** or as **relative paths** (`/uploads/...`). Email clients (Gmail, Outlook, etc.) strip/block `data:` image src for security, and an inbox has no origin to resolve a relative `/...` path against.

**Why:** the admin bulk-email composer uses a ReactQuill editor whose default `image` toolbar button inlines the picked file as a base64 data URI. The bulk-send route also only absolutized the wrapper *logo* URL, never images inside the composed body.

**How to apply:** any image going into an email body must be a full `https://` URL.
- Client: the editor's `image` handler uploads the file (to a server route) and embeds the returned absolute URL via `insertEmbed(index, 'image', url)` — never base64. Each editor needs its own ref so the handler targets the right instance.
- Server: the upload route proxies to the external `/themes/upload-resource` (returns a *relative* path) and prepends `BASE_URL` to make it absolute before returning.
- Defense in depth: the send route rewrites any remaining relative `<img src="/...">` to `BASE_URL + path` so legacy/template content with relative images also renders.
- Base64 images also bloat the request body — they were part of the earlier 413 "request entity too large".
