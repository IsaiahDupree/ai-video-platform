"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractEnumJsonPaths = void 0;
const extractEnumJsonPaths = ({ schema, zodRuntime, currentPath, zodTypes, }) => {
    const def = schema._def;
    const typeName = def.typeName;
    switch (typeName) {
        case zodRuntime.ZodFirstPartyTypeKind.ZodObject: {
            const shape = def.shape();
            const keys = Object.keys(shape);
            return keys
                .map((key) => {
                return (0, exports.extractEnumJsonPaths)({
                    schema: shape[key],
                    zodRuntime,
                    currentPath: [...currentPath, key],
                    zodTypes,
                });
            })
                .flat(1);
        }
        case zodRuntime.ZodFirstPartyTypeKind.ZodArray: {
            return (0, exports.extractEnumJsonPaths)({
                schema: def.type,
                zodRuntime,
                currentPath: [...currentPath, '[]'],
                zodTypes,
            });
        }
        case zodRuntime.ZodFirstPartyTypeKind.ZodUnion: {
            return def.options
                .map((option) => {
                return (0, exports.extractEnumJsonPaths)({
                    schema: option,
                    zodRuntime,
                    currentPath,
                    zodTypes,
                });
            })
                .flat(1);
        }
        case zodRuntime.ZodFirstPartyTypeKind.ZodDiscriminatedUnion: {
            return def.options
                .map((op) => {
                return (0, exports.extractEnumJsonPaths)({
                    schema: op,
                    zodRuntime,
                    currentPath,
                    zodTypes,
                });
            })
                .flat(1);
        }
        case zodRuntime.ZodFirstPartyTypeKind.ZodLiteral: {
            return [currentPath];
        }
        case zodRuntime.ZodFirstPartyTypeKind.ZodEffects: {
            if (zodTypes &&
                schema._def.description ===
                    zodTypes.ZodZypesInternals.REMOTION_MATRIX_BRAND) {
                return [currentPath];
            }
            return (0, exports.extractEnumJsonPaths)({
                schema: def.schema,
                zodRuntime,
                currentPath,
                zodTypes,
            });
        }
        case zodRuntime.ZodFirstPartyTypeKind.ZodIntersection: {
            const { left, right } = def;
            const leftValue = (0, exports.extractEnumJsonPaths)({
                schema: left,
                zodRuntime,
                currentPath,
                zodTypes,
            });
            const rightValue = (0, exports.extractEnumJsonPaths)({
                schema: right,
                zodRuntime,
                currentPath,
                zodTypes,
            });
            return [...leftValue, ...rightValue];
        }
        case zodRuntime.ZodFirstPartyTypeKind.ZodTuple: {
            return def.items
                .map((item, i) => (0, exports.extractEnumJsonPaths)({
                schema: item,
                zodRuntime,
                currentPath: [...currentPath, i],
                zodTypes,
            }))
                .flat(1);
        }
        case zodRuntime.ZodFirstPartyTypeKind.ZodRecord: {
            const values = (0, exports.extractEnumJsonPaths)({
                schema: def.valueType,
                zodRuntime,
                currentPath: [...currentPath, '{}'],
                zodTypes,
            });
            return values;
        }
        case zodRuntime.ZodFirstPartyTypeKind.ZodFunction: {
            throw new Error('Cannot create a value for type function');
        }
        case zodRuntime.ZodFirstPartyTypeKind.ZodEnum: {
            return [currentPath];
        }
        case zodRuntime.ZodFirstPartyTypeKind.ZodNativeEnum: {
            return [];
        }
        case zodRuntime.ZodFirstPartyTypeKind.ZodOptional: {
            const defType = def;
            const value = (0, exports.extractEnumJsonPaths)({
                schema: defType.innerType,
                zodRuntime,
                currentPath,
                zodTypes,
            });
            return value;
        }
        case zodRuntime.ZodFirstPartyTypeKind.ZodNullable: {
            const defType = def;
            const value = (0, exports.extractEnumJsonPaths)({
                schema: defType.innerType,
                zodRuntime,
                currentPath,
                zodTypes,
            });
            return value;
        }
        case zodRuntime.ZodFirstPartyTypeKind.ZodDefault: {
            const defType = def;
            return (0, exports.extractEnumJsonPaths)({
                schema: defType.innerType,
                zodRuntime,
                currentPath,
                zodTypes,
            });
        }
        case zodRuntime.ZodFirstPartyTypeKind.ZodCatch: {
            const defType = def;
            return (0, exports.extractEnumJsonPaths)({
                schema: defType.innerType,
                zodRuntime,
                currentPath,
                zodTypes,
            });
        }
        case zodRuntime.ZodFirstPartyTypeKind.ZodPromise: {
            return [];
        }
        case zodRuntime.ZodFirstPartyTypeKind.ZodBranded: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const defType = def;
            const value = (0, exports.extractEnumJsonPaths)({
                schema: defType.type,
                zodRuntime,
                currentPath,
                zodTypes,
            });
            return value;
        }
        case zodRuntime.ZodFirstPartyTypeKind.ZodPipeline: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const defType = def;
            const value = (0, exports.extractEnumJsonPaths)({
                schema: defType.out,
                zodRuntime,
                currentPath,
                zodTypes,
            });
            return value;
        }
        case zodRuntime.ZodFirstPartyTypeKind.ZodString:
        case zodRuntime.ZodFirstPartyTypeKind.ZodNumber:
        case zodRuntime.ZodFirstPartyTypeKind.ZodBigInt:
        case zodRuntime.ZodFirstPartyTypeKind.ZodBoolean:
        case zodRuntime.ZodFirstPartyTypeKind.ZodNaN:
        case zodRuntime.ZodFirstPartyTypeKind.ZodDate:
        case zodRuntime.ZodFirstPartyTypeKind.ZodSymbol:
        case zodRuntime.ZodFirstPartyTypeKind.ZodUndefined:
        case zodRuntime.ZodFirstPartyTypeKind.ZodNull:
        case zodRuntime.ZodFirstPartyTypeKind.ZodAny:
        case zodRuntime.ZodFirstPartyTypeKind.ZodUnknown:
        case zodRuntime.ZodFirstPartyTypeKind.ZodNever:
        case zodRuntime.ZodFirstPartyTypeKind.ZodVoid:
        case zodRuntime.ZodFirstPartyTypeKind.ZodMap: // Maps are not serializable
        case zodRuntime.ZodFirstPartyTypeKind.ZodLazy:
        case zodRuntime.ZodFirstPartyTypeKind.ZodSet: {
            // Sets are not serializable
            return [];
        }
        default:
            throw new Error('Not implemented: ' + typeName);
    }
};
exports.extractEnumJsonPaths = extractEnumJsonPaths;
