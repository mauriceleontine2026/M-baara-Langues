$ErrorActionPreference = 'Stop'

Write-Host 'Creating Python virtual environment...'
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
Write-Host 'Installing backend dependencies...'
pip install -r requirements.txt
Write-Host 'Installing PyTorch CPU...'
pip install --index-url https://download.pytorch.org/whl/cpu torch
Write-Host 'Checking ffmpeg...'
if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
    Write-Host 'ffmpeg non trouvé. Installez ffmpeg et ajoutez-le au PATH.'
} else {
    ffmpeg -version | Select-Object -First 1
}
Write-Host 'Installation terminée. Vérifiez votre fichier .env et lancez uvicorn.'
