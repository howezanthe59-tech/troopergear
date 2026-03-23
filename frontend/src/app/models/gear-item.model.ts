export interface IGearItem {
    id: number;
    name: string;
    type: string;
    activity?: string;
    description: string;
    price: number;
    stock: number;
    badge?: string;
    image: string;
    capacity?: number;
}

export interface CartVariant {
    color?: string;
    size?: string;
}

export interface CartItem {
    gearData: any;
    quantity: number;
    variant?: CartVariant;
}
