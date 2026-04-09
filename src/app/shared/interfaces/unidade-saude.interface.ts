import { Endereco } from "./endereco.interface";

export interface UnidadeSaude {
    id: number;
    name: string;
    cnpj: string;
    phone: string;
    email: string;
    address: Endereco;
}
