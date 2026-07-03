# retry-deploy.ps1 — keep re-running the deploy with an IDENTICAL digest until
# Netlify's backend finishes computing it and a retry lands instantly.
# Do NOT edit site files while this runs (a content change = new cold digest).
$log = "C:\Users\insta\instanthpi-donations\deploy-retry.log"
"=== retry loop start ===" | Out-File $log -Encoding utf8
for ($i = 1; $i -le 6; $i++) {
  "--- attempt $i of 6 ---" | Out-File $log -Append -Encoding utf8
  $out = & "C:\Program Files\nodejs\node.exe" "C:\Users\insta\instanthpi-donations\refresh-donations.cjs" 2>&1
  $out | Out-File $log -Append -Encoding utf8
  if (($out | Out-String) -match "LIVE:|no deploy needed") {
    "=== SUCCESS on attempt $i ===" | Out-File $log -Append -Encoding utf8
    exit 0
  }
  Start-Sleep -Seconds 60
}
"=== ALL ATTEMPTS EXHAUSTED ===" | Out-File $log -Append -Encoding utf8
exit 1
