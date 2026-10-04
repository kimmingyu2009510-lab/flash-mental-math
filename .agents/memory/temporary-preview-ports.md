---
name: Temporary preview ports
description: Replit metadata side effects caused by opening a temporary local preview server.
---

Starting a temporary local preview server can cause Replit to add a port mapping and Node runtime module to `.replit`, even when no persistent workflow is intended.

**Why:** The environment updates artifact metadata when it detects a listening port.

**How to apply:** After browser checks, stop the temporary server and restore the prior `.replit` contents; verify the config has no unintended diff.