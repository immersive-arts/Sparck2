#!/usr/bin/env bash
set -e

# CUSTOMIZE THESE
identity="Developer ID Application: Zurcher Hochschule der Kunste (D95XR8PG48)"
package_path="../../.."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "Signing Max Package WITHOUT hardened runtime..."
echo ""

# Sign support folder dylibs
if [ -d "${package_path}/support" ]; then
    echo "Signing support libraries..."
    find "${package_path}/support" -name "*.dylib" | while read dylib; do
        echo -e "${GREEN}→ $(basename $dylib)${NC}"
        codesign --force --sign "$identity" --timestamp --deep "$dylib"
    done
fi

# Sign externals
echo ""
echo "Signing externals..."
find "${package_path}/externals" -name "*.mxo" | while read mxo; do
    echo -e "${GREEN}→ $(basename $mxo)${NC}"
    codesign --force --sign "$identity" --timestamp --deep "$mxo"
done

echo ""
echo -e "${GREEN}✓ Done! Try loading your external in Max now.${NC}"