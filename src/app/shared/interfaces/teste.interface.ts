import { Paciente } from "./usuario.interface"

export interface Teste {
    id: number
    tipoTeste: TipoTeste
    dataHora: Date
    status: number
    dataCriacao: Date
    observacoes: string
}

export enum TipoTeste {
    DOISMST,
    UTT
}