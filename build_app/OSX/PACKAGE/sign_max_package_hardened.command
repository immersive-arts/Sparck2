#!/usr/bin/env bash
#
# Code signing script for Max Package externals
# Matches Max.app's hardened runtime signing with appropriate entitlements
#
# Max is signed with hardened runtime, so externals should be too

set -e  # Exit on any error

BASEDIR=$(dirname "$0")
cd "$BASEDIR"

# Configuration - CUSTOMIZE THESE VALUES
identity="Developer ID Application: Zurcher Hochschule der Kunste (D95XR8PG48)"
package_path="../../.."  # Path to your Max package root
entitlements_file="max_externals_minimal.entitlement"

# Color output for better readability
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Derived paths
externals_path="${package_path}/externals"
support_path="${package_path}/support"

echo "=========================================="
echo "Max Package Codesigning (Hardened Runtime)"
echo "=========================================="
echo "Identity: $identity"
echo "Package path: $package_path"
echo "Entitlements: $entitlements_file"
echo ""
echo "Signing WITH hardened runtime to match Max.app"
echo "=========================================="
echo ""

# Verify prerequisites
if [ ! -d "$package_path" ]; then
    echo -e "${RED}Error: Package not found at ${package_path}${NC}"
    exit 1
fi

if [ ! -f "$entitlements_file" ]; then
    echo -e "${RED}Error: Entitlements file not found: ${entitlements_file}${NC}"
    echo "Create this file with the necessary entitlements"
    exit 1
fi

# Check if identity exists
if ! security find-identity -v -p codesigning | grep -q "$identity"; then
    echo -e "${RED}Error: Signing identity not found in keychain${NC}"
    echo "Available identities:"
    security find-identity -v -p codesigning
    exit 1
fi

echo -e "${GREEN}Step 1: Signing support folder libraries${NC}"
echo "=========================================="

if [ -d "$support_path" ]; then
    support_count=0
    while IFS= read -r -d '' dylib; do
        dylib_name=$(basename "$dylib")
        echo -e "${GREEN}→ Signing: ${dylib_name}${NC}"
        # Sign support libraries with hardened runtime and entitlements
        if codesign --force \
                    --sign "$identity" \
                    --timestamp \
                    -o runtime \
                    --entitlements "$entitlements_file" \
                    "$dylib" 2>&1; then
            ((support_count++))
            echo -e "${GREEN}  ✓ Success${NC}"
        else
            echo -e "${RED}  ✗ Failed${NC}"
        fi
    done < <(find "$support_path" -type f -name "*.dylib" -print0 2>/dev/null)
    
    if [ $support_count -gt 0 ]; then
        echo -e "${GREEN}✓ Signed ${support_count} library/libraries${NC}"
    else
        echo -e "${YELLOW}No dylibs found in support folder${NC}"
    fi
else
    echo -e "${YELLOW}Support folder not found - skipping${NC}"
fi

echo ""

echo -e "${GREEN}Step 2: Signing externals (nested components first)${NC}"
echo "=========================================="

if [ ! -d "$externals_path" ]; then
    echo -e "${RED}Externals folder not found${NC}"
    exit 1
fi

external_count=0
failed_count=0

while IFS= read -r -d '' mxo; do
    mxo_name=$(basename "$mxo")
    echo ""
    echo -e "${YELLOW}Processing: ${mxo_name}${NC}"
    
    # Sign nested dylibs first
    if [ -d "${mxo}/Contents/MacOS" ]; then
        find "${mxo}/Contents/MacOS" -type f -name "*.dylib" 2>/dev/null | while read dylib; do
            echo -e "${GREEN}  → Nested dylib: $(basename $dylib)${NC}"
            codesign --force \
                     --sign "$identity" \
                     --timestamp \
                     -o runtime \
                     --entitlements "$entitlements_file" \
                     "$dylib" 2>&1 || true
        done
    fi
    
    # Sign nested frameworks
    if [ -d "${mxo}/Contents/Frameworks" ]; then
        find "${mxo}/Contents/Frameworks" -type d -name "*.framework" -depth 1 2>/dev/null | while read fw; do
            echo -e "${GREEN}  → Framework: $(basename $fw)${NC}"
            codesign --force \
                     --sign "$identity" \
                     --timestamp \
                     -o runtime \
                     --entitlements "$entitlements_file" \
                     "$fw" 2>&1 || true
        done
    fi
    
    # Sign the .mxo bundle itself
    echo -e "${GREEN}  → Signing bundle: ${mxo_name}${NC}"
    if codesign --force \
                --sign "$identity" \
                --timestamp \
                -o runtime \
                --entitlements "$entitlements_file" \
                "$mxo" 2>&1; then
        echo -e "${GREEN}  ✓ Success${NC}"
        ((external_count++))
    else
        echo -e "${RED}  ✗ Failed${NC}"
        ((failed_count++))
    fi
    
done < <(find "$externals_path" -type d -name "*.mxo" -print0)

echo ""
echo "=========================================="
echo "Summary"
echo "=========================================="
echo -e "${GREEN}Successfully signed: ${external_count} external(s)${NC}"
if [ $failed_count -gt 0 ]; then
    echo -e "${RED}Failed: ${failed_count} external(s)${NC}"
fi

echo ""

if [ $failed_count -eq 0 ] && [ $external_count -gt 0 ]; then
    echo "=========================================="
    echo -e "${GREEN}✓ Signing completed successfully!${NC}"
    echo "=========================================="
    echo ""
    echo "Your externals are now signed with hardened runtime"
    echo "matching Max.app's signing requirements."
    echo ""
    echo "Test your externals in Max now."
    echo ""
    echo "If you still get loading errors:"
    echo "1. Check Console.app for detailed error messages"
    echo "2. You may need additional entitlements"
    echo "3. See TROUBLESHOOTING.md for more help"
    exit 0
else
    echo "=========================================="
    echo -e "${RED}✗ Signing completed with errors${NC}"
    echo "=========================================="
    exit 1
fi
