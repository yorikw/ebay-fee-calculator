export type CategoryKey = 'most' | 'media' | 'electronics' | 'musical' | 'motors' | 'custom';

export interface CategoryFeeRate {
    readonly label: string;
    readonly noStoreRate: number;
    readonly storeRate: number;
}

export class Constants {
    static readonly CATEGORY_RATES: Record<CategoryKey, CategoryFeeRate> = {
        most: {
            label: 'Most categories',
            noStoreRate: 0.136,
            storeRate: 0.127,
        },
        media: {
            label: 'Books, movies, music',
            noStoreRate: 0.153,
            storeRate: 0.144,
        },
        electronics: {
            label: 'Consumer electronics',
            noStoreRate: 0.09,
            storeRate: 0.087,
        },
        musical: {
            label: 'Musical instruments & gear',
            noStoreRate: 0.0635,
            storeRate: 0.0595,
        },
        motors: {
            label: 'eBay Motors parts & accessories',
            noStoreRate: 0.136,
            storeRate: 0.1235,
        },
        custom: {
            label: 'Custom rate',
            noStoreRate: 0.136,
            storeRate: 0.127,
        },
    };

    static readonly LOW_ORDER_FEE_LIMIT = 10.0;
    static readonly LOW_ORDER_FEE = 0.30;
    static readonly HIGH_ORDER_FEE = 0.40;
    static readonly TOP_RATED_PLUS_DISCOUNT_RATE = 0.10;
    static readonly INTERNATIONAL_FEE_RATE = 0.0165;
    static readonly DEFAULT_PAYMENT_PROCESSOR_RATE = 0.0349;
    static readonly DEFAULT_PAYMENT_PROCESSOR_FIXED_FEE = 0.49;
}
