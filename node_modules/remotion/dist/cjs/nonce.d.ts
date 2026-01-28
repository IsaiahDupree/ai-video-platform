export type TNonceContext = {
    getNonce: () => number;
    fastRefreshes: number;
    manualRefreshes: number;
};
export type TSetNonceContext = {
    increaseManualRefreshes: () => void;
};
export declare const NonceContext: import("react").Context<TNonceContext>;
export declare const SetNonceContext: import("react").Context<TSetNonceContext>;
export declare const useNonce: () => number;
