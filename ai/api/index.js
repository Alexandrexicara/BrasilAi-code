const fs = require('fs');
const path = require('path');

const modelosPath = path.join(__dirname, '..', 'configuracoes', 'modelos.json');
const modelosConfig = JSON.parse(fs.readFileSync(modelosPath, 'utf-8'));

const provedores = {
  groq: require('./groq'),
  ollama: require('./ollama'),
  llamafile: require('./llamafile'),
};

function obterModeloAtivo() {
  return modelosConfig.modelo_ativo;
}

function obterConfigModelo(id) {
  return modelosConfig.modelos_disponiveis.find(m => m.id === id);
}

async function executarChat(mensagens, parametros = {}) {
  const modeloId = parametros.modelo || obterModeloAtivo();
  const configModelo = obterConfigModelo(modeloId);

  if (!configModelo) {
    throw new Error(`Modelo "${modeloId}" não encontrado na configuração`);
  }

  const provedor = provedores[configModelo.provedor];
  if (!provedor) {
    throw new Error(`Provedor "${configModelo.provedor}" não implementado`);
  }

  const params = { ...configModelo.parametros_padrao, ...parametros };

  return await provedor.chatCompletion(modeloId, mensagens, params);
}

async function listarModelos() {
  const ativo = obterModeloAtivo();
  const configModelo = obterConfigModelo(ativo);
  const provedor = provedores[configModelo?.provedor] || provedores.groq;
  try {
    return await provedor.listarModelos();
  } catch {
    return [];
  }
}

async function verificarSaude() {
  const ativo = obterModeloAtivo();
  const configModelo = obterConfigModelo(ativo);
  const provedor = provedores[configModelo?.provedor] || provedores.groq;
  return await provedor.verificarSaude();
}

module.exports = { executarChat, listarModelos, verificarSaude, obterModeloAtivo };
