
export interface Endereco extends Cidade {
    streetName: string
    bairro: string
    streetNumber: string
    complement: string
    zipCode: string
}

export interface Cidade extends Estado {
    city: string
}

export interface Estado {
    state: string
}