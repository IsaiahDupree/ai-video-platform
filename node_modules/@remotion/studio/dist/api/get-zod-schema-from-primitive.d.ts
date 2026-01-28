import type { ZodType } from '../components/get-zod-if-possible';
export declare const getZodSchemaFromPrimitive: (value: unknown, z: ZodType) => import("zod").ZodString | import("zod").ZodNumber;
