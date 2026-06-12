# Lädt alle Seiten aus pages.txt als Roh-HTML nach _raw/ (Byte-treu, kein Encoding-Umweg)
$base = "d:\Claude\VS Code\DDIM"
$ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) DDIM-Relaunch-Demo (Kontakt: contact@akyol.de)"
$ok = 0; $fail = @()
Get-Content "$base\tools\pages.txt" | Where-Object { $_ -match '\|' } | ForEach-Object {
    $url, $rel = $_ -split '\|'
    $target = Join-Path "$base\_raw" $rel
    $dir = Split-Path $target -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force $dir | Out-Null }
    if (Test-Path $target) { $ok++; return }
    try {
        Invoke-WebRequest -Uri $url -OutFile $target -UseBasicParsing -UserAgent $ua -TimeoutSec 60
        $ok++
        Start-Sleep -Milliseconds 300
    } catch {
        $fail += "$url :: $($_.Exception.Message)"
    }
}
Write-Output "OK: $ok"
if ($fail) { Write-Output "FAILED:"; $fail }
