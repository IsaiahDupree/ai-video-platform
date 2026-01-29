module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[project]/src/utils/hashUserData.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * User Data Hashing Utility
 *
 * Provides consistent SHA256 hashing of PII data for Meta Pixel and CAPI.
 * Works in both browser and Node.js environments.
 *
 * Meta requires all PII (Personally Identifiable Information) to be hashed
 * with SHA256 before sending via Conversions API or Advanced Matching.
 *
 * PII Fields that should be hashed:
 * - em: email address
 * - ph: phone number
 * - fn: first name
 * - ln: last name
 * - ct: city
 * - st: state
 * - zp: zip/postal code
 * - country: country code
 * - ge: gender
 * - db: date of birth (YYYYMMDD format)
 *
 * Documentation:
 * https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/customer-information-parameters
 */ /**
 * Hash a string value with SHA256
 * Works in both browser (SubtleCrypto) and Node.js (crypto module)
 *
 * @param value - The string value to hash
 * @returns Promise resolving to the SHA256 hash (lowercase hex)
 */ __turbopack_context__.s([
    "hashDateOfBirth",
    ()=>hashDateOfBirth,
    "hashEmail",
    ()=>hashEmail,
    "hashPhone",
    ()=>hashPhone,
    "hashUserData",
    ()=>hashUserData,
    "hashValue",
    ()=>hashValue,
    "isUserDataHashed",
    ()=>isUserDataHashed,
    "isValidSHA256Hash",
    ()=>isValidSHA256Hash
]);
async function hashValue(value) {
    if (!value) return '';
    // Normalize: lowercase and trim whitespace
    const normalized = value.toLowerCase().trim();
    // Browser environment - use SubtleCrypto
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    // Node.js environment - use crypto module
    if ("TURBOPACK compile-time truthy", 1) {
        try {
            const crypto = __turbopack_context__.r("[externals]/crypto [external] (crypto, cjs)");
            return crypto.createHash('sha256').update(normalized).digest('hex');
        } catch (error) {
            console.error('Failed to load crypto module:', error);
            throw new Error('Hashing not available in this environment');
        }
    }
    throw new Error('No hashing method available');
}
async function hashPhone(phone) {
    if (!phone) return '';
    // Remove all non-digit characters except leading +
    let cleaned = phone.trim();
    if (cleaned.startsWith('+')) {
        cleaned = '+' + cleaned.substring(1).replace(/\D/g, '');
    } else {
        cleaned = cleaned.replace(/\D/g, '');
    }
    return hashValue(cleaned);
}
async function hashEmail(email) {
    if (!email) return '';
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleaned = email.toLowerCase().trim();
    if (!emailRegex.test(cleaned)) {
        console.warn('Invalid email format:', email);
        return '';
    }
    return hashValue(cleaned);
}
async function hashDateOfBirth(dob) {
    if (!dob) return '';
    let formatted;
    if (dob instanceof Date) {
        // Use UTC to avoid timezone issues
        const year = dob.getUTCFullYear();
        const month = String(dob.getUTCMonth() + 1).padStart(2, '0');
        const day = String(dob.getUTCDate()).padStart(2, '0');
        formatted = `${year}${month}${day}`;
    } else {
        // Remove dashes and spaces
        formatted = dob.replace(/[-\s]/g, '');
        // Validate YYYYMMDD format
        if (!/^\d{8}$/.test(formatted)) {
            console.warn('Invalid date of birth format (expected YYYYMMDD):', dob);
            return '';
        }
    }
    return hashValue(formatted);
}
async function hashUserData(userData) {
    const hashed = {};
    // Hash email
    if (userData.email) {
        hashed.em = await hashEmail(userData.email);
    }
    // Hash phone
    if (userData.phone) {
        hashed.ph = await hashPhone(userData.phone);
    }
    // Hash first name
    if (userData.firstName) {
        hashed.fn = await hashValue(userData.firstName);
    }
    // Hash last name
    if (userData.lastName) {
        hashed.ln = await hashValue(userData.lastName);
    }
    // Hash city
    if (userData.city) {
        hashed.ct = await hashValue(userData.city);
    }
    // Hash state
    if (userData.state) {
        hashed.st = await hashValue(userData.state);
    }
    // Hash zip code
    if (userData.zipCode) {
        hashed.zp = await hashValue(userData.zipCode);
    }
    // Hash country (should be 2-letter ISO country code)
    if (userData.country) {
        hashed.country = await hashValue(userData.country);
    }
    // Hash gender (should be 'm' or 'f')
    if (userData.gender) {
        hashed.ge = await hashValue(userData.gender);
    }
    // Hash date of birth
    if (userData.dateOfBirth) {
        hashed.db = await hashDateOfBirth(userData.dateOfBirth);
    }
    return hashed;
}
function isValidSHA256Hash(hash) {
    return /^[a-f0-9]{64}$/i.test(hash);
}
function isUserDataHashed(userData) {
    const values = Object.values(userData).filter((v)=>typeof v === 'string' && v.length > 0);
    if (values.length === 0) return false;
    return values.every((value)=>isValidSHA256Hash(value));
}
}),
"[project]/src/app/api/meta/hash-user-data/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
/**
 * API Endpoint: Hash User Data
 *
 * POST /api/meta/hash-user-data
 *
 * Hashes user PII data with SHA256 for Meta Pixel/CAPI tracking.
 * This endpoint allows the client to hash sensitive user data server-side
 * before sending to Meta for conversion tracking.
 *
 * Security Notes:
 * - This endpoint should be rate-limited in production
 * - Consider adding authentication if needed
 * - User data is not stored, only hashed and returned
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$hashUserData$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/hashUserData.ts [app-route] (ecmascript)");
;
;
async function POST(request) {
    try {
        const userData = await request.json();
        // Validate that we have at least one field to hash
        if (!userData || Object.keys(userData).length === 0) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'No user data provided'
            }, {
                status: 400
            });
        }
        // Hash all provided user data
        const hashedData = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$hashUserData$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hashUserData"])(userData);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            hashedData
        });
    } catch (error) {
        console.error('[Hash User Data API] Error:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Failed to hash user data',
            message: error instanceof Error ? error.message : 'Unknown error'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__998a45c6._.js.map