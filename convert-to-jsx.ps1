$files = @(
    "src/App.js",
    "src/axios/config.js",
    "src/components/Layout/JavaScript/Navbar.js",
    "src/components/Layout/JavaScript/Pagination.js",
    "src/components/Movies/JavaScript/MovieCardHorizontal.js",
    "src/components/Movies/JavaScript/MovieCardVertical.js",
    "src/components/Movies/JavaScript/SearchBox.js",
    "src/context/Language.js",
    "src/index.js",
    "src/pages/JavaScript/Details.js",
    "src/pages/JavaScript/Home.js",
    "src/pages/JavaScript/Login.js",
    "src/pages/JavaScript/NotFound.js",
    "src/pages/JavaScript/Registertion.js",
    "src/pages/JavaScript/Search.js",
    "src/pages/JavaScript/User.js",
    "src/pages/JavaScript/WatchList.js",
    "src/reportWebVitals.js",
    "src/routes/RoutesConfig.js",
    "src/store/Slices/auth.js",
    "src/store/Slices/registeration.js",
    "src/store/Slices/watchlist.js",
    "src/store/index.js"
)

foreach ($file in $files) {
    $oldPath = $file
    $newPath = $file -replace "\.js$", ".jsx"
    
    # Skip non-React files
    if ($file -match "(config|reportWebVitals|index)\.js$") {
        Write-Host "Skipping $file as it's not a React component"
        continue
    }
    
    # Rename file
    if (Test-Path $oldPath) {
        Move-Item -Path $oldPath -Destination $newPath -Force
        Write-Host "Renamed $oldPath to $newPath"
    }
    
    # Update imports in the new file
    if (Test-Path $newPath) {
        $content = Get-Content $newPath -Raw
        $content = $content -replace '(import .* from .*?)\.js', '$1.jsx'
        Set-Content -Path $newPath -Value $content
        Write-Host "Updated imports in $newPath"
    }
}
