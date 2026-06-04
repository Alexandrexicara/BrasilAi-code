# Script para baixar modelo GGUF do Hugging Face
$url = "https://huggingface.co/HauhauCS/Qwen3.6-35B-A3B-Uncensored-HauhauCS-Aggressive/resolve/main/Qwen3.6-35B-A3B-Uncensored-HauhauCS-Aggressive-IQ2_M.gguf"
$output = "$PSScriptRoot\modelos\Qwen3.6-35B-A3B-Uncensored-HauhauCS-Aggressive-IQ2_M.gguf"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Baixando modelo GGUF do Hugging Face" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Modelo: Qwen3.6-35B-A3B-Uncensored-HauhauCS-Aggressive-IQ2_M.gguf"
Write-Host "Destino: $output"
Write-Host ""

# Criar pasta modelos se nao existir
if (!(Test-Path "$PSScriptRoot\modelos")) {
    New-Item -ItemType Directory -Path "$PSScriptRoot\modelos" -Force | Out-Null
}

Write-Host "Iniciando download... (pode demorar, o arquivo e grande)" -ForegroundColor Yellow
Write-Host ""

try {
    Write-Host "Usando WebClient com progresso..." -ForegroundColor Cyan
    Write-Host ""
    
    $webClient = New-Object System.Net.WebClient
    
    # Registrar evento de progresso
    $eventId = Register-ObjectEvent -InputObject $webClient -EventName DownloadProgressChanged -Action {
        $percent = $EventArgs.ProgressPercentage
        $received = [math]::Round($EventArgs.BytesReceived/1MB, 1)
        $total = [math]::Round($EventArgs.TotalBytesToReceive/1MB, 1)
        Write-Progress -Activity "Baixando modelo GGUF" -Status "$received MB / $total MB" -PercentComplete $percent
    }
    
    # Iniciar download assincrono
    $webClient.DownloadFileAsync([Uri]$url, $output)
    
    # Aguardar conclusao mostrando progresso
    while ($webClient.IsBusy) {
        Start-Sleep -Milliseconds 500
    }
    
    Unregister-Event -SourceIdentifier $eventId.Name -ErrorAction SilentlyContinue
    Write-Progress -Activity "Baixando modelo GGUF" -Completed
    
    if (Test-Path $output) {
        $tamanho = [math]::Round((Get-Item $output).Length / 1GB, 2)
        Write-Host ""
        Write-Host "Download concluido com sucesso! Tamanho: $tamanho GB" -ForegroundColor Green
    } else {
        Write-Host "Erro: arquivo nao encontrado." -ForegroundColor Red
    }
} catch {
    Write-Host "Erro: $_" -ForegroundColor Red
}
