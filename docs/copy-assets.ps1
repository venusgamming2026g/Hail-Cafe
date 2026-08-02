$docsDir = "c:\Users\المسار الذهبي\Desktop\Hail-Cafe\Hail-Cafe\docs"
$publicDir = "c:\Users\المسار الذهبي\Desktop\Hail-Cafe\Hail-Cafe\public"

# Create directories if they don't exist
if (!(Test-Path -Path $docsDir)) {
    New-Item -ItemType Directory -Path $docsDir | Out-Null
}

# Copy files
if (Test-Path -Path "$publicDir\hail-logo.png") {
    Copy-Item -Path "$publicDir\hail-logo.png" -Destination "$docsDir\hail-logo.png" -Force
}
if (Test-Path -Path "$publicDir\og.png") {
    Copy-Item -Path "$publicDir\og.png" -Destination "$docsDir\og.png" -Force
}
if (Test-Path -Path "$publicDir\favicon.svg") {
    Copy-Item -Path "$publicDir\favicon.svg" -Destination "$docsDir\favicon.svg" -Force
}

# Copy directories
if (Test-Path -Path "$publicDir\hail-gallery") {
    if (!(Test-Path -Path "$docsDir\hail-gallery")) {
        New-Item -ItemType Directory -Path "$docsDir\hail-gallery" | Out-Null
    }
    Copy-Item -Path "$publicDir\hail-gallery\*" -Destination "$docsDir\hail-gallery\" -Recurse -Force
}

if (Test-Path -Path "$publicDir\menu") {
    if (!(Test-Path -Path "$docsDir\menu")) {
        New-Item -ItemType Directory -Path "$docsDir\menu" | Out-Null
    }
    Copy-Item -Path "$publicDir\menu\*" -Destination "$docsDir\menu\" -Recurse -Force
}

Write-Host "Assets copied successfully to $docsDir"
