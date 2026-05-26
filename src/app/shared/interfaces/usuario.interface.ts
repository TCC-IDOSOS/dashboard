import { Endereco } from "./endereco.interface"
import { Teste } from "./teste.interface"
import { UnidadeSaude } from "./unidade-saude.interface"

export interface ProfissionalSaude {
    usuario: Usuario
    registroConselho: string
    especialidade: string
}

export interface Paciente extends Usuario {
    qtdQuedas: number
    testes: [Teste]
}

export interface Usuario {
    id: number
    name: string
    cpf: string
    genre: Genero
    birthDate: Date
    email: string
    profile: PerfilUsuario,
    address: Endereco
    phone: string
    ativo: string
    password: string,
    healthUnit: UnidadeSaude
}

export enum PerfilUsuario {
    PROFISSIONAL = "Profissional",
    PACIENTE = "Paciente",
    ADMIN = "Admin"
}

export enum Genero {
    MASCULINO = "Masculino",
    FEMININO = "Feminino",
    PREFIRO_NAO_INFORMAR = "Prefiro não informar",
    OUTRO = "Outro"
}