import type { ZodType, ZodTypesType } from '../../get-zod-if-possible';
export declare const extractEnumJsonPaths: ({ schema, zodRuntime, currentPath, zodTypes, }: {
    schema: Zod.ZodTypeAny;
    zodRuntime: ZodType;
    zodTypes: ZodTypesType | null;
    currentPath: (string | number)[];
}) => (string | number)[][];
