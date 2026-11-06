#!/usr/bin/env bash
# PteroDash Installer & Manager (Compatibility wrapper)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "$SCRIPT_DIR/pterodash.sh" "$@"
