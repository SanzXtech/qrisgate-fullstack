#!/bin/bash
set -e

# ================================================
# QRISGate APK Builder — No Gradle, No Kotlin
# RAM Usage: ~200MB (vs 3.5GB with React Native)
# ================================================

PROJECT="/root/qrisgate-app"
SDK="/root/android-sdk"
BUILD_TOOLS="$SDK/build-tools/35.0.0"
PLATFORM="$SDK/platforms/android-35/android.jar"

AAPT2="$BUILD_TOOLS/aapt2"
D8="$BUILD_TOOLS/d8"
ZIPALIGN="$BUILD_TOOLS/zipalign"
APKSIGNER="$BUILD_TOOLS/apksigner"

GEN="$PROJECT/gen"
OBJ="$PROJECT/obj"
BIN="$PROJECT/bin"

echo "🔧 QRISGate APK Builder"
echo "========================"
echo ""

# Clean
rm -rf "$GEN"/* "$OBJ"/* "$BIN"/*
mkdir -p "$GEN" "$OBJ" "$BIN"

# Step 1: Compile resources with aapt2
echo "📦 Step 1/6: Compiling resources..."
find "$PROJECT/res" -name "*.xml" -o -name "*.png" -o -name "*.jpg" | while read f; do
    $AAPT2 compile "$f" -o "$OBJ/" 2>/dev/null || true
done
echo "   ✅ Resources compiled"

# Step 2: Link resources & generate R.java
echo "📎 Step 2/6: Linking resources..."
$AAPT2 link \
    -o "$BIN/app.unsigned.apk" \
    -I "$PLATFORM" \
    --manifest "$PROJECT/AndroidManifest.xml" \
    --java "$GEN" \
    --min-sdk-version 24 \
    --target-sdk-version 35 \
    --auto-add-overlay \
    $OBJ/*.flat
echo "   ✅ Resources linked, R.java generated"

# Step 3: Compile Java
echo "☕ Step 3/6: Compiling Java source..."
mkdir -p "$OBJ/classes"
find "$PROJECT/src" "$GEN" -name "*.java" > "$OBJ/sources.txt"
javac \
    -source 11 -target 11 \
    -encoding UTF-8 \
    -cp "$PLATFORM" \
    -d "$OBJ/classes" \
    @"$OBJ/sources.txt" \
    -Xlint:none 2>&1 | head -20
echo "   ✅ Java compiled"

# Step 4: Convert to DEX
echo "🔄 Step 4/6: Converting to DEX..."
CLASS_FILES=$(find "$OBJ/classes" -name "*.class" -type f)
if [ -z "$CLASS_FILES" ]; then
    echo "   ❌ No class files found!"
    exit 1
fi
$D8 \
    --release \
    --min-api 24 \
    --output "$OBJ" \
    $CLASS_FILES
echo "   ✅ DEX created"

# Step 5: Add DEX to APK
echo "📱 Step 5/6: Packaging APK..."
cd "$OBJ"
zip -j "$BIN/app.unsigned.apk" classes.dex
cd "$PROJECT"

# Zipalign
$ZIPALIGN -f 4 "$BIN/app.unsigned.apk" "$BIN/app.aligned.apk"
echo "   ✅ APK packaged & aligned"

# Step 6: Sign APK
echo "🔐 Step 6/6: Signing APK..."
# Generate debug keystore if not exists
KEYSTORE="$PROJECT/debug.keystore"
if [ ! -f "$KEYSTORE" ]; then
    keytool -genkeypair \
        -keystore "$KEYSTORE" \
        -storepass android \
        -keypass android \
        -alias androiddebugkey \
        -keyalg RSA \
        -keysize 2048 \
        -validity 10000 \
        -dname "CN=Debug,O=Android,C=US" \
        -noprompt 2>/dev/null
fi

$APKSIGNER sign \
    --ks "$KEYSTORE" \
    --ks-pass pass:android \
    --key-pass pass:android \
    --ks-key-alias androiddebugkey \
    --out "$BIN/qrisgate.apk" \
    "$BIN/app.aligned.apk"

echo "   ✅ APK signed"

# Result
APK_SIZE=$(du -h "$BIN/qrisgate.apk" | cut -f1)
echo ""
echo "========================"
echo "✅ BUILD SUKSES!"
echo "📱 APK: $BIN/qrisgate.apk"
echo "📏 Size: $APK_SIZE"
echo "========================"
