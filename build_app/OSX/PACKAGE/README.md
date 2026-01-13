# Max Package Externals Code Signing

This script signs all Max externals (.mxo bundles) in a Max package's externals folder for macOS distribution.

## Files Included

- `sign_max_package_externals.command` - Main signing script
- `max_externals.entitlement` - Sample entitlements file (customize as needed)

## Prerequisites

1. **Apple Developer Account** with a valid "Developer ID Application" certificate
2. **Xcode Command Line Tools** installed: `xcode-select --install`
3. **Valid signing identity** in your keychain

## Setup Instructions

### 1. Find Your Signing Identity

Run this command to list available signing identities:

```bash
security find-identity -v -p codesigning
```

You'll see output like:
```
1) ABC123DEF456 "Developer ID Application: Your Name (TEAM_ID)"
```

Copy the identity name (the part in quotes).

### 2. Configure the Script

Edit `sign_max_package_externals.command` and update these variables:

```bash
identity="Developer ID Application: Your Name (TEAM_ID)"  # Your actual identity
package_path="../YourPackageName"  # Path to your Max package
```

**Example Max Package Structure:**
```
YourPackageName/
├── externals/
│   ├── your_external.mxo
│   ├── another_external.mxo
│   └── subfolder/
│       └── nested_external.mxo
├── support/
│   └── libhelper.dylib
├── patchers/
├── docs/
└── package-info.json
```

### 3. Customize Entitlements (Optional)

The `max_externals.entitlement` file includes common entitlements for Max externals:

- **JIT compilation** - Required for some DSP operations
- **Unsigned executable memory** - For dynamic code generation
- **Disable library validation** - Allows loading unsigned libraries
- **Audio/Camera device access** - If your externals use these
- **Network access** - If your externals communicate over network

**Remove entitlements you don't need** to follow the principle of least privilege.

If you don't need entitlements at all, you can delete the file or leave it empty.

### 4. Make Script Executable

```bash
chmod +x sign_max_package_externals.command
```

## Running the Script

### Method 1: Double-click (macOS Finder)

1. Double-click `sign_max_package_externals.command`
2. Terminal will open and run the script
3. Check the output for any errors

### Method 2: Command Line

```bash
./sign_max_package_externals.command
```

## What the Script Does

1. **Validates** your signing identity and package structure
2. **Signs support folder libraries** (.dylib files in the support folder)
3. **Finds** all .mxo bundles in the externals folder (including subfolders)
4. **Signs nested components** first:
   - Dynamic libraries (.dylib)
   - Nested frameworks
5. **Signs each .mxo bundle** with:
   - Your developer identity
   - Hardened runtime
   - Timestamp (for long-term validity)
   - Entitlements (if provided)
6. **Verifies** all signatures
7. **Reports** success or errors

## Troubleshooting

### Error: "Signing identity not found"

- Run `security find-identity -v -p codesigning` to verify your certificate
- Make sure you've installed your Developer ID certificate in Keychain
- Certificate might be in a different keychain (check Keychain Access app)

### Error: "Package not found"

- Check that `package_path` points to the correct location
- Use relative or absolute paths
- Example: `../MyPackage` or `/Users/yourname/MaxPackages/MyPackage`

### Error: "Externals folder not found"

- Verify your package has an `externals` folder
- Check spelling and case sensitivity

### Some externals fail to sign

- Check the Terminal output for specific error messages
- Some externals might have nested components that need signing first
- Try signing problematic externals individually to see detailed errors

### Verification failures

- Re-run the script (sometimes works)
- Check that no other process is modifying the files
- Verify your certificate hasn't expired

## Distribution Workflow

After signing your externals:

### 1. Create Installer Package

**Option A: DMG (Simple)**
```bash
hdiutil create -volname "MyPackage" -srcfolder /path/to/YourPackageName -ov -format UDZO MyPackage.dmg
```

**Option B: PKG (Recommended for Mac App Store)**
```bash
pkgbuild --root /path/to/YourPackageName \
         --identifier com.yourname.maxpackage \
         --version 1.0 \
         --install-location "/Users/Shared/Max 8/Packages/YourPackageName" \
         unsigned.pkg
```

### 2. Sign the Installer

```bash
productsign --sign "Developer ID Installer: Your Name (TEAM_ID)" \
             unsigned.pkg \
             signed.pkg
```

### 3. Notarize with Apple

First, create an app-specific password at [appleid.apple.com](https://appleid.apple.com)

Store credentials in keychain:
```bash
xcrun notarytool store-credentials "notarization-profile" \
  --apple-id "your@email.com" \
  --team-id "TEAM_ID"
```

Submit for notarization:
```bash
xcrun notarytool submit signed.pkg \
  --keychain-profile "notarization-profile" \
  --wait
```

### 4. Staple the Ticket

After successful notarization:
```bash
xcrun stapler staple signed.pkg
```

### 5. Verify Notarization

```bash
spctl -a -vv -t install signed.pkg
```

You should see: "source=Notarized Developer ID"

## Tips

- **Test on a clean Mac** without your developer certificate to verify it works
- **Keep your certificate valid** - Developer ID certificates expire after 5 years
- **Sign before zipping** - Always sign before creating distribution archives
- **Use relative paths** in the script for portability
- **Back up your signed externals** - Re-signing can be tedious

## Common Max External Patterns

### Basic External (single binary)
```
myexternal.mxo/
└── Contents/
    └── MacOS/
        └── myexternal
```

### External with Frameworks
```
myexternal.mxo/
└── Contents/
    ├── Frameworks/
    │   └── MyLib.framework/
    └── MacOS/
        └── myexternal
```

### External with Dynamic Libraries
```
myexternal.mxo/
└── Contents/
    └── MacOS/
        ├── myexternal
        └── libhelper.dylib
```

The script handles all these patterns automatically.

## Resources

- [Apple Code Signing Guide](https://developer.apple.com/library/archive/documentation/Security/Conceptual/CodeSigningGuide/)
- [Notarizing macOS Software](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
- [Max Package Format](https://docs.cycling74.com/max8/vignettes/packages)

## Credits

Adapted from TelemersiveGateway codesigning script by Roman Haefeli and Martin Froehlich.
