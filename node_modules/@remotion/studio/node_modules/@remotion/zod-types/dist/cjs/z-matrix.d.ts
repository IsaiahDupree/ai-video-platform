import { z } from 'zod';
export declare const REMOTION_MATRIX_BRAND = "__remotion-matrix";
export declare const zMatrix: () => z.ZodEffects<z.ZodArray<z.ZodNumber, "many">, number[], number[]>;
