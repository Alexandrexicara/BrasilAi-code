#!/bin/bash
REPO="/d/Brasil-code-ai/Brasil-codeAI-"

echo "=== Entrando no repositorio ==="
cd "$REPO" || exit 1
pwd

echo "=== Configurando Git ==="
git config --global --add safe.directory "$REPO"

echo "=== Verificando remote ==="
git remote -v
if [ $? -ne 0 ]; then
    git remote add origin https://github.com/Alexandrexicara/Brasil-codeAI-.git
fi

echo "=== Adicionando todos os arquivos ==="
git add -A

echo "=== Fazendo commit ==="
git commit -m "Atualiza rotas e autenticacao"

echo "=== Fazendo push ==="
git push origin main --force

echo "=== Pronto! ==="
