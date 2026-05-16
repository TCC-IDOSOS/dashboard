export interface CicloTeste {
  ciclo: number;
  amplitude_cm: number;
  velocidade_subida_cm_s: number;
  tempo_subida_s: number;
  tempo_ciclo_s: number;
  potencia_w: number;
  trabalho_j: number;
}

export interface DetalheTeste {
  total_repeticoes: number;
  repeticoes_completas: number;
  percentual_completas: number;
  altura_media: number;
  cadencia: number;
  amplitude_maxima_oscilacao: number;
  tempo_total_execucao: number;
  desvio_padrao_aceleracoes: number;
  velocidade_media_oscilacao: number;
  indice_estabilidade: number | null;
  classificacao: string | null;
  cycles: CicloTeste[];
  t_s: number[]; // Time series
}

export interface TesteDetalhe {
  paciente: {
    nome: string;
    cpf: string;
    idade: string;
    endereco: string;
    cep: string;
    quedas: string;
  };
  avaliador: {
    dataHora: string;
    nome: string;
    unidade: string;
    endereco: string;
  };
  metricas: DetalheTeste;
}

export interface TesteListagem {
  id: number;
  createdAt: string;
  updatedAt: string;
  processedS3Key: string | null;
  rawS3Key: string;
  status: string;
  testDateTime: string; 
  testType: string;
  totalRepetitionsApp: number;
}