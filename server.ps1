$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:8010/")
$listener.Start()
Write-Host "serving $root at http://localhost:8010/"
$mime = @{".html"="text/html"; ".js"="text/javascript"; ".css"="text/css"; ".svg"="image/svg+xml"; ".png"="image/png"}
while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    try {
        $file = $ctx.Request.Url.AbsolutePath.TrimStart("/")
        if ($file -eq "") { $file = "index.html" }
        $path = Join-Path $root $file
        if (Test-Path $path -PathType Leaf) {
            $ext = [IO.Path]::GetExtension($path).ToLower()
            $type = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { "application/octet-stream" }
            $bytes = [IO.File]::ReadAllBytes($path)
            $ctx.Response.ContentType = $type
            $ctx.Response.ContentLength64 = $bytes.Length
            $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $ctx.Response.StatusCode = 404
        }
    } catch {
        try { $ctx.Response.StatusCode = 500 } catch {}
    }
    try { $ctx.Response.Close() } catch {}
}
