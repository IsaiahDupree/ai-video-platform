import type { _InternalTypes } from 'remotion';
import type { AnyZodObject } from 'zod';
export type UpdateDefaultPropsFunction = (currentValues: {
    schema: AnyZodObject | null;
    savedDefaultProps: Record<string, unknown>;
    unsavedDefaultProps: Record<string, unknown>;
}) => Record<string, unknown>;
export declare const calcNewProps: (compositionId: string, defaultProps: UpdateDefaultPropsFunction) => {
    composition: _InternalTypes["AnyComposition"];
    generatedDefaultProps: Record<string, unknown>;
};
