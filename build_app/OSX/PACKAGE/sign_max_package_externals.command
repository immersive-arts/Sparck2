#!/usr/bin/env bash
#
# Code signing script for Max Package externals
# Signs all .mxo bundles in a Max package's externals folder
#
# Adapted from TelemersiveGateway signing script
# Modified for Max Package structure

set -e  # Exit on any error

BASEDIR=$(dirname "$0")
cd "$BASEDIR"

# Configuration - CUSTOMIZE THESE VALUES
identity="Developer ID Application: Zurcher Hochschule der Kunste (D95XR8PG48)"
package_path="../../.."  # Path to your Max package root
entitlements_file="max_externals.entitlement"  # Optional entitlements file

# Color output for better readability
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Derived paths
externals_path="${package_path}/externals"
support_path="${package_path}/support"

# Function to sign with error checking
sign_component() {
    local component="$1"
    local description="$2"
    
    if [ ! -e "$component" ]; then
        echo -e "${YELLOW}⚠ Skipping (not found): ${description}${NC}"
        return 0
    fi
    
    echo -e "${GREEN}→ Signing: ${description}${NC}"
    
    # Build codesign command
    local sign_cmd="codesign --force --sign \"${identity}\" --timestamp -o runtime"
    
    # Add entitlements if file exists
    if [ -f "$entitlements_file" ]; then
        sign_cmd="${sign_cmd} --entitlements \"${entitlements_file}\""
    fi
    
    sign_cmd="${sign_cmd} \"${component}\""
    
    if eval $sign_cmd 2>&1; then
        echo -e "${GREEN}  ✓ Success${NC}"
        return 0
    else
        echo -e "${RED}  ✗ Failed to sign: ${component}${NC}"
        return 1
    fi
}

# Function to verify signature
verify_signature() {
    local component="$1"
    local description="$2"
    
    echo -e "${YELLOW}Verifying: ${description}${NC}"
    if codesign --verify --deep --strict --verbose=2 "$component" 2>&1; then
        echo -e "${GREEN}✓ Verification successful${NC}"
        return 0
    else
        echo -e "${RED}✗ Verification failed${NC}"
        return 1
    fi
}

echo "=========================================="
echo "Max Package Externals Codesigning Script"
echo "=========================================="
echo "Identity: $identity"
echo "Package path: $package_path"
echo "Externals path: $externals_path"
echo "Support path: $support_path"
if [ -f "$entitlements_file" ]; then
    echo "Entitlements: $entitlements_file"
else
    echo "Entitlements: None (file not found)"
fi
echo "=========================================="
echo ""

# Verify prerequisites
if [ ! -d "$package_path" ]; then
    echo -e "${RED}Error: Package not found at ${package_path}${NC}"
    exit 1
fi

# Check if identity exists
if ! security find-identity -v -p codesigning | grep -q "$identity"; then
    echo -e "${RED}Error: Signing identity not found in keychain${NC}"
    echo "Available identities:"
    security find-identity -v -p codesigning
    exit 1
fi

echo -e "${GREEN}Step 1: Signing Support Folder Libraries${NC}"
echo "=========================================="

if [ -d "$support_path" ]; then
    # Find all dylibs in support folder
    support_dylibs=()
    while IFS= read -r -d '' dylib; do
        support_dylibs+=("$dylib")
    done < <(find "$support_path" -type f -name "*.dylib" -print0)
    
    if [ ${#support_dylibs[@]} -gt 0 ]; then
        echo "Found ${#support_dylibs[@]} dylib(s) in support folder"
        echo ""
        
        for dylib in "${support_dylibs[@]}"
        do
            dylib_name=$(basename "$dylib")
            sign_component "$dylib" "Support dylib: ${dylib_name}"
        done
    else
        echo -e "${YELLOW}No dylibs found in support folder${NC}"
    fi
else
    echo -e "${YELLOW}Support folder not found - skipping${NC}"
fi

echo ""

echo -e "${GREEN}Step 2: Finding all .mxo externals${NC}"
echo "=========================================="

# Find all .mxo bundles
mxo_bundles=()
while IFS= read -r -d '' mxo; do
    mxo_bundles+=("$mxo")
    echo "Found: $(basename "$mxo")"
done < <(find "$externals_path" -type d -name "*.mxo" -print0)

echo ""
echo "Total externals found: ${#mxo_bundles[@]}"
echo ""

if [ ${#mxo_bundles[@]} -eq 0 ]; then
    echo -e "${YELLOW}No .mxo externals found in ${externals_path}${NC}"
    exit 0
fi

echo -e "${GREEN}Step 3: Signing externals and nested components${NC}"
echo "=========================================="

signed_count=0
failed_count=0

for mxo in "${mxo_bundles[@]}"
do
    external_name=$(basename "$mxo")
    echo ""
    echo -e "${YELLOW}Processing: ${external_name}${NC}"
    
    # Sign nested dylibs first (if any)
    if [ -d "${mxo}/Contents/MacOS" ]; then
        find "${mxo}/Contents/MacOS" -type f -name "*.dylib" 2>/dev/null | while read dylib; do
            sign_component "$dylib" "  Nested dylib: $(basename $dylib)"
        done
    fi
    
    # Sign any nested frameworks (rare but possible)
    if [ -d "${mxo}/Contents/Frameworks" ]; then
        find "${mxo}/Contents/Frameworks" -type d -name "*.framework" -depth 1 2>/dev/null | while read fw; do
            # Sign dylibs inside framework first
            if [ -d "${fw}/Versions/A" ]; then
                find "${fw}/Versions/A" -type f -name "*.dylib" 2>/dev/null | while read dylib; do
                    sign_component "$dylib" "    Framework dylib: $(basename $dylib)"
                done
            fi
            sign_component "$fw" "  Framework: $(basename $fw)"
        done
    fi
    
    # Sign the main .mxo bundle
    if sign_component "$mxo" "External: ${external_name}"; then
        ((signed_count++))
    else
        ((failed_count++))
    fi
done

echo ""
echo "=========================================="
echo -e "${GREEN}Step 4: Verification${NC}"
echo "=========================================="

verification_failed=0

# Verify support folder dylibs if they exist
if [ -d "$support_path" ] && [ ${#support_dylibs[@]} -gt 0 ]; then
    echo ""
    echo "Verifying support folder libraries..."
    for dylib in "${support_dylibs[@]}"
    do
        dylib_name=$(basename "$dylib")
        if ! verify_signature "$dylib" "Support: $dylib_name"; then
            ((verification_failed++))
        fi
    done
fi

# Verify externals
echo ""
echo "Verifying externals..."
for mxo in "${mxo_bundles[@]}"
do
    external_name=$(basename "$mxo")
    if ! verify_signature "$mxo" "$external_name"; then
        ((verification_failed++))
    fi
done

echo ""
echo "=========================================="
echo "Summary"
echo "=========================================="
echo "Total externals found: ${#mxo_bundles[@]}"
echo -e "${GREEN}Successfully signed: ${signed_count}${NC}"
if [ $failed_count -gt 0 ]; then
    echo -e "${RED}Failed to sign: ${failed_count}${NC}"
fi
if [ $verification_failed -gt 0 ]; then
    echo -e "${RED}Failed verification: ${verification_failed}${NC}"
fi

if [ $failed_count -eq 0 ] && [ $verification_failed -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo -e "${GREEN}✓ All externals signed successfully!${NC}"
    echo "=========================================="
    echo ""
    echo "Your Max externals are now code-signed and ready for distribution."
    echo ""
    echo "Next steps for distribution:"
    echo "1. Create a DMG or PKG installer containing your package"
    echo "2. Sign the installer:"
    echo "   productsign --sign \"Developer ID Installer: Your Name\" unsigned.pkg signed.pkg"
    echo "3. Submit for notarization:"
    echo "   xcrun notarytool submit signed.pkg --keychain-profile \"notarization-profile\" --wait"
    echo "4. Staple the notarization ticket:"
    echo "   xcrun stapler staple signed.pkg"
    exit 0
else
    echo ""
    echo "=========================================="
    echo -e "${RED}✗ Signing completed with errors${NC}"
    echo "=========================================="
    exit 1
fi
