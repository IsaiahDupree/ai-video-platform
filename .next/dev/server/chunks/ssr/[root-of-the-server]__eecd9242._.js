module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/src/types/workspace.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Workspace Types - ADS-014
 * Type definitions for workspace management and role-based access control
 */ /**
 * User role in a workspace
 */ __turbopack_context__.s([
    "ActionType",
    ()=>ActionType,
    "DEFAULT_WORKSPACE_SETTINGS",
    ()=>DEFAULT_WORKSPACE_SETTINGS,
    "ROLE_PERMISSIONS",
    ()=>ROLE_PERMISSIONS,
    "ResourceType",
    ()=>ResourceType,
    "WorkspaceRole",
    ()=>WorkspaceRole,
    "createWorkspace",
    ()=>createWorkspace,
    "hasRoleOrHigher",
    ()=>hasRoleOrHigher,
    "isValidWorkspaceRole",
    ()=>isValidWorkspaceRole,
    "isWorkspace",
    ()=>isWorkspace,
    "isWorkspaceMember",
    ()=>isWorkspaceMember
]);
var WorkspaceRole = /*#__PURE__*/ function(WorkspaceRole) {
    WorkspaceRole["OWNER"] = "owner";
    WorkspaceRole["ADMIN"] = "admin";
    WorkspaceRole["EDITOR"] = "editor";
    WorkspaceRole["VIEWER"] = "viewer";
    return WorkspaceRole;
}({});
var ResourceType = /*#__PURE__*/ function(ResourceType) {
    ResourceType["WORKSPACE"] = "workspace";
    ResourceType["BRAND_KIT"] = "brand_kit";
    ResourceType["AD_TEMPLATE"] = "ad_template";
    ResourceType["CAMPAIGN"] = "campaign";
    ResourceType["RENDER"] = "render";
    ResourceType["MEMBER"] = "member";
    ResourceType["SETTINGS"] = "settings";
    return ResourceType;
}({});
var ActionType = /*#__PURE__*/ function(ActionType) {
    ActionType["CREATE"] = "create";
    ActionType["READ"] = "read";
    ActionType["UPDATE"] = "update";
    ActionType["DELETE"] = "delete";
    ActionType["MANAGE"] = "manage";
    ActionType["RENDER"] = "render";
    ActionType["EXPORT"] = "export";
    ActionType["INVITE"] = "invite";
    return ActionType;
}({});
const ROLE_PERMISSIONS = {
    ["owner"]: [
        // Owners can do everything
        {
            resource: "workspace",
            action: "manage",
            roles: [
                "owner"
            ]
        },
        {
            resource: "brand_kit",
            action: "manage",
            roles: [
                "owner"
            ]
        },
        {
            resource: "ad_template",
            action: "manage",
            roles: [
                "owner"
            ]
        },
        {
            resource: "campaign",
            action: "manage",
            roles: [
                "owner"
            ]
        },
        {
            resource: "render",
            action: "manage",
            roles: [
                "owner"
            ]
        },
        {
            resource: "member",
            action: "manage",
            roles: [
                "owner"
            ]
        },
        {
            resource: "settings",
            action: "manage",
            roles: [
                "owner"
            ]
        }
    ],
    ["admin"]: [
        // Admins can manage most things except workspace deletion
        {
            resource: "workspace",
            action: "read",
            roles: [
                "admin"
            ]
        },
        {
            resource: "workspace",
            action: "update",
            roles: [
                "admin"
            ]
        },
        {
            resource: "brand_kit",
            action: "manage",
            roles: [
                "admin"
            ]
        },
        {
            resource: "ad_template",
            action: "manage",
            roles: [
                "admin"
            ]
        },
        {
            resource: "campaign",
            action: "manage",
            roles: [
                "admin"
            ]
        },
        {
            resource: "render",
            action: "manage",
            roles: [
                "admin"
            ]
        },
        {
            resource: "member",
            action: "invite",
            roles: [
                "admin"
            ]
        },
        {
            resource: "member",
            action: "read",
            roles: [
                "admin"
            ]
        },
        {
            resource: "settings",
            action: "update",
            roles: [
                "admin"
            ]
        }
    ],
    ["editor"]: [
        // Editors can create and edit content
        {
            resource: "workspace",
            action: "read",
            roles: [
                "editor"
            ]
        },
        {
            resource: "brand_kit",
            action: "read",
            roles: [
                "editor"
            ]
        },
        {
            resource: "ad_template",
            action: "create",
            roles: [
                "editor"
            ]
        },
        {
            resource: "ad_template",
            action: "read",
            roles: [
                "editor"
            ]
        },
        {
            resource: "ad_template",
            action: "update",
            roles: [
                "editor"
            ]
        },
        {
            resource: "campaign",
            action: "create",
            roles: [
                "editor"
            ]
        },
        {
            resource: "campaign",
            action: "read",
            roles: [
                "editor"
            ]
        },
        {
            resource: "campaign",
            action: "update",
            roles: [
                "editor"
            ]
        },
        {
            resource: "render",
            action: "render",
            roles: [
                "editor"
            ]
        },
        {
            resource: "render",
            action: "read",
            roles: [
                "editor"
            ]
        },
        {
            resource: "render",
            action: "export",
            roles: [
                "editor"
            ]
        },
        {
            resource: "member",
            action: "read",
            roles: [
                "editor"
            ]
        }
    ],
    ["viewer"]: [
        // Viewers can only read
        {
            resource: "workspace",
            action: "read",
            roles: [
                "viewer"
            ]
        },
        {
            resource: "brand_kit",
            action: "read",
            roles: [
                "viewer"
            ]
        },
        {
            resource: "ad_template",
            action: "read",
            roles: [
                "viewer"
            ]
        },
        {
            resource: "campaign",
            action: "read",
            roles: [
                "viewer"
            ]
        },
        {
            resource: "render",
            action: "read",
            roles: [
                "viewer"
            ]
        },
        {
            resource: "member",
            action: "read",
            roles: [
                "viewer"
            ]
        }
    ]
};
function isValidWorkspaceRole(role) {
    return Object.values(WorkspaceRole).includes(role);
}
function isWorkspace(obj) {
    return obj && typeof obj === 'object' && typeof obj.id === 'string' && typeof obj.name === 'string' && typeof obj.ownerId === 'string' && Array.isArray(obj.members) && obj.settings && typeof obj.createdAt === 'string' && typeof obj.updatedAt === 'string' && typeof obj.isActive === 'boolean';
}
function isWorkspaceMember(obj) {
    return obj && typeof obj === 'object' && typeof obj.userId === 'string' && typeof obj.email === 'string' && isValidWorkspaceRole(obj.role) && typeof obj.invitedAt === 'string' && typeof obj.invitedBy === 'string';
}
const DEFAULT_WORKSPACE_SETTINGS = {
    renderQuality: 'standard',
    maxConcurrentRenders: 5,
    storageProvider: 'local',
    allowGuestAccess: false,
    requireApproval: false,
    emailNotifications: true
};
function createWorkspace(partial) {
    const now = new Date().toISOString();
    // Owner is automatically added as a member
    const ownerMember = {
        userId: partial.ownerId,
        email: partial.members?.[0]?.email || 'owner@example.com',
        name: partial.members?.[0]?.name,
        role: "owner",
        invitedAt: now,
        acceptedAt: now,
        invitedBy: partial.ownerId,
        lastActiveAt: now
    };
    return {
        description: '',
        members: [
            ownerMember
        ],
        settings: DEFAULT_WORKSPACE_SETTINGS,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        ...partial
    };
}
function hasRoleOrHigher(userRole, requiredRole) {
    const roleHierarchy = [
        "viewer",
        "editor",
        "admin",
        "owner"
    ];
    const userLevel = roleHierarchy.indexOf(userRole);
    const requiredLevel = roleHierarchy.indexOf(requiredRole);
    return userLevel >= requiredLevel;
}
}),
"[project]/src/types/approval.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ApprovableResourceType",
    ()=>ApprovableResourceType,
    "ApprovalAction",
    ()=>ApprovalAction,
    "ApprovalStatus",
    ()=>ApprovalStatus,
    "DEFAULT_APPROVAL_SETTINGS",
    ()=>DEFAULT_APPROVAL_SETTINGS,
    "canPerformAction",
    ()=>canPerformAction,
    "getActionDisplayName",
    ()=>getActionDisplayName,
    "getActionForTransition",
    ()=>getActionForTransition,
    "getStatusColor",
    ()=>getStatusColor,
    "getStatusDisplayName",
    ()=>getStatusDisplayName,
    "isApprovableResource",
    ()=>isApprovableResource,
    "isValidStatusTransition",
    ()=>isValidStatusTransition
]);
/**
 * Approval Workflow Types - ADS-016
 * Type definitions for approval workflow: Draft → In Review → Approved
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$workspace$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/types/workspace.ts [app-ssr] (ecmascript)");
;
var ApprovalStatus = /*#__PURE__*/ function(ApprovalStatus) {
    ApprovalStatus["DRAFT"] = "draft";
    ApprovalStatus["IN_REVIEW"] = "in_review";
    ApprovalStatus["APPROVED"] = "approved";
    ApprovalStatus["REJECTED"] = "rejected";
    ApprovalStatus["CHANGES_REQUESTED"] = "changes_requested";
    return ApprovalStatus;
}({});
var ApprovableResourceType = /*#__PURE__*/ function(ApprovableResourceType) {
    ApprovableResourceType["AD"] = "ad";
    ApprovableResourceType["CAMPAIGN"] = "campaign";
    ApprovableResourceType["AD_VARIANT"] = "ad_variant";
    ApprovableResourceType["CAMPAIGN_ASSET"] = "campaign_asset";
    return ApprovableResourceType;
}({});
const DEFAULT_APPROVAL_SETTINGS = {
    enabled: false,
    requiredApprovers: 1,
    allowedApproverRoles: [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$workspace$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WorkspaceRole"].OWNER,
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$workspace$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WorkspaceRole"].ADMIN
    ],
    allowedReviewerRoles: [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$workspace$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WorkspaceRole"].OWNER,
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$workspace$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WorkspaceRole"].ADMIN,
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$workspace$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WorkspaceRole"].EDITOR
    ],
    autoApproveOwner: true,
    requireCommentOnReject: true,
    notifyOnStatusChange: true,
    notifyApprovers: true
};
var ApprovalAction = /*#__PURE__*/ function(ApprovalAction) {
    ApprovalAction["SUBMIT_FOR_REVIEW"] = "submit_for_review";
    ApprovalAction["APPROVE"] = "approve";
    ApprovalAction["REJECT"] = "reject";
    ApprovalAction["REQUEST_CHANGES"] = "request_changes";
    ApprovalAction["REVERT_TO_DRAFT"] = "revert_to_draft";
    return ApprovalAction;
}({});
function isApprovableResource(obj) {
    return obj && typeof obj === 'object' && typeof obj.id === 'string' && typeof obj.workspaceId === 'string' && typeof obj.resourceType === 'string' && Object.values(ApprovableResourceType).includes(obj.resourceType) && typeof obj.approvalStatus === 'string' && Object.values(ApprovalStatus).includes(obj.approvalStatus) && Array.isArray(obj.approvalHistory) && Array.isArray(obj.comments);
}
function isValidStatusTransition(from, to) {
    const validTransitions = {
        ["draft"]: [
            "in_review"
        ],
        ["in_review"]: [
            "approved",
            "rejected",
            "changes_requested",
            "draft"
        ],
        ["approved"]: [
            "draft"
        ],
        ["rejected"]: [
            "draft"
        ],
        ["changes_requested"]: [
            "draft",
            "in_review"
        ]
    };
    return validTransitions[from]?.includes(to) || false;
}
function getActionForTransition(from, to) {
    if (from === "draft" && to === "in_review") {
        return "submit_for_review";
    }
    if (from === "in_review" && to === "approved") {
        return "approve";
    }
    if (from === "in_review" && to === "rejected") {
        return "reject";
    }
    if (from === "in_review" && to === "changes_requested") {
        return "request_changes";
    }
    if (to === "draft") {
        return "revert_to_draft";
    }
    return null;
}
function canPerformAction(action, userRole, settings, isOwner) {
    switch(action){
        case "submit_for_review":
            return settings.allowedReviewerRoles.includes(userRole);
        case "approve":
            return settings.allowedApproverRoles.includes(userRole);
        case "reject":
        case "request_changes":
            return settings.allowedApproverRoles.includes(userRole);
        case "revert_to_draft":
            // Owner and creator can revert, admins can revert if it's in review
            return isOwner || userRole === __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$workspace$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WorkspaceRole"].OWNER || userRole === __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$workspace$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WorkspaceRole"].ADMIN;
        default:
            return false;
    }
}
function getStatusColor(status) {
    switch(status){
        case "draft":
            return '#6b7280'; // gray
        case "in_review":
            return '#f59e0b'; // amber
        case "approved":
            return '#10b981'; // green
        case "rejected":
            return '#ef4444'; // red
        case "changes_requested":
            return '#3b82f6'; // blue
        default:
            return '#6b7280';
    }
}
function getStatusDisplayName(status) {
    switch(status){
        case "draft":
            return 'Draft';
        case "in_review":
            return 'In Review';
        case "approved":
            return 'Approved';
        case "rejected":
            return 'Rejected';
        case "changes_requested":
            return 'Changes Requested';
        default:
            return status;
    }
}
function getActionDisplayName(action) {
    switch(action){
        case "submit_for_review":
            return 'Submit for Review';
        case "approve":
            return 'Approve';
        case "reject":
            return 'Reject';
        case "request_changes":
            return 'Request Changes';
        case "revert_to_draft":
            return 'Revert to Draft';
        default:
            return action;
    }
}
}),
"[project]/src/app/ads/review/components/ReviewItemCard.module.css [app-ssr] (css module)", ((__turbopack_context__) => {

__turbopack_context__.v({
  "actionButton": "ReviewItemCard-module__LdjCCW__actionButton",
  "actionButtons": "ReviewItemCard-module__LdjCCW__actionButtons",
  "actions": "ReviewItemCard-module__LdjCCW__actions",
  "card": "ReviewItemCard-module__LdjCCW__card",
  "commentInput": "ReviewItemCard-module__LdjCCW__commentInput",
  "commentsIndicator": "ReviewItemCard-module__LdjCCW__commentsIndicator",
  "content": "ReviewItemCard-module__LdjCCW__content",
  "description": "ReviewItemCard-module__LdjCCW__description",
  "header": "ReviewItemCard-module__LdjCCW__header",
  "metadata": "ReviewItemCard-module__LdjCCW__metadata",
  "metadataItem": "ReviewItemCard-module__LdjCCW__metadataItem",
  "metadataLabel": "ReviewItemCard-module__LdjCCW__metadataLabel",
  "metadataValue": "ReviewItemCard-module__LdjCCW__metadataValue",
  "modal": "ReviewItemCard-module__LdjCCW__modal",
  "modalBody": "ReviewItemCard-module__LdjCCW__modalBody",
  "modalCancelButton": "ReviewItemCard-module__LdjCCW__modalCancelButton",
  "modalClose": "ReviewItemCard-module__LdjCCW__modalClose",
  "modalContent": "ReviewItemCard-module__LdjCCW__modalContent",
  "modalFooter": "ReviewItemCard-module__LdjCCW__modalFooter",
  "modalHeader": "ReviewItemCard-module__LdjCCW__modalHeader",
  "modalSubmitButton": "ReviewItemCard-module__LdjCCW__modalSubmitButton",
  "statusBadge": "ReviewItemCard-module__LdjCCW__statusBadge",
  "tag": "ReviewItemCard-module__LdjCCW__tag",
  "tags": "ReviewItemCard-module__LdjCCW__tags",
  "thumbnail": "ReviewItemCard-module__LdjCCW__thumbnail",
  "thumbnailImage": "ReviewItemCard-module__LdjCCW__thumbnailImage",
  "title": "ReviewItemCard-module__LdjCCW__title",
  "viewButton": "ReviewItemCard-module__LdjCCW__viewButton",
});
}),
"[project]/src/app/ads/review/components/ReviewItemCard.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ReviewItemCard",
    ()=>ReviewItemCard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
/**
 * ReviewItemCard Component
 * Displays an approvable resource card with actions
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$approval$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/types/approval.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$workspace$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/types/workspace.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ReviewItemCard$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/src/app/ads/review/components/ReviewItemCard.module.css [app-ssr] (css module)");
'use client';
;
;
;
;
;
function ReviewItemCard({ item, onUpdate }) {
    const [showActions, setShowActions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [showCommentModal, setShowCommentModal] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [comment, setComment] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    // TODO: Get from auth context
    const currentUser = {
        userId: 'admin-1',
        role: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$workspace$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WorkspaceRole"].ADMIN
    };
    async function handleAction(action, requireComment = false) {
        if (requireComment && !comment.trim()) {
            setShowCommentModal(true);
            return;
        }
        try {
            setLoading(true);
            // TODO: Replace with actual API call
            console.log('Performing action:', {
                resourceId: item.id,
                action,
                userId: currentUser.userId,
                userRole: currentUser.role,
                comment: comment || undefined
            });
            // Simulate API call
            await new Promise((resolve)=>setTimeout(resolve, 500));
            alert(`Action "${action}" completed successfully!`);
            setComment('');
            setShowCommentModal(false);
            onUpdate();
        } catch (error) {
            console.error('Failed to perform action:', error);
            alert('Failed to perform action. Please try again.');
        } finally{
            setLoading(false);
        }
    }
    function getAvailableActions() {
        const actions = [];
        switch(item.approvalStatus){
            case __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$approval$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ApprovalStatus"].DRAFT:
                actions.push({
                    action: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$approval$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ApprovalAction"].SUBMIT_FOR_REVIEW,
                    label: 'Submit for Review',
                    color: '#3b82f6'
                });
                break;
            case __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$approval$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ApprovalStatus"].IN_REVIEW:
                actions.push({
                    action: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$approval$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ApprovalAction"].APPROVE,
                    label: 'Approve',
                    color: '#10b981'
                }, {
                    action: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$approval$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ApprovalAction"].REQUEST_CHANGES,
                    label: 'Request Changes',
                    color: '#f59e0b',
                    requireComment: true
                }, {
                    action: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$approval$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ApprovalAction"].REJECT,
                    label: 'Reject',
                    color: '#ef4444',
                    requireComment: true
                });
                break;
            case __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$approval$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ApprovalStatus"].APPROVED:
            case __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$approval$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ApprovalStatus"].REJECTED:
            case __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$approval$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ApprovalStatus"].CHANGES_REQUESTED:
                actions.push({
                    action: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$approval$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ApprovalAction"].REVERT_TO_DRAFT,
                    label: 'Revert to Draft',
                    color: '#6b7280'
                });
                break;
        }
        return actions;
    }
    const availableActions = getAvailableActions();
    const statusColor = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$approval$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getStatusColor"])(item.approvalStatus);
    const statusName = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$approval$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getStatusDisplayName"])(item.approvalStatus);
    const timeAgo = getTimeAgo(new Date(item.updatedAt));
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ReviewItemCard$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].card,
                children: [
                    item.thumbnailUrl && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ReviewItemCard$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].thumbnail,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                            src: item.thumbnailUrl,
                            alt: item.name,
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ReviewItemCard$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].thumbnailImage
                        }, void 0, false, {
                            fileName: "[project]/src/app/ads/review/components/ReviewItemCard.tsx",
                            lineNumber: 138,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/review/components/ReviewItemCard.tsx",
                        lineNumber: 137,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ReviewItemCard$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].content,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ReviewItemCard$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].header,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ReviewItemCard$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].title,
                                        children: item.name
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/review/components/ReviewItemCard.tsx",
                                        lineNumber: 148,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ReviewItemCard$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].statusBadge,
                                        style: {
                                            backgroundColor: statusColor
                                        },
                                        children: statusName
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/review/components/ReviewItemCard.tsx",
                                        lineNumber: 149,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/ads/review/components/ReviewItemCard.tsx",
                                lineNumber: 147,
                                columnNumber: 11
                            }, this),
                            item.description && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ReviewItemCard$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].description,
                                children: item.description
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/review/components/ReviewItemCard.tsx",
                                lineNumber: 158,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ReviewItemCard$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].metadata,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ReviewItemCard$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].metadataItem,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ReviewItemCard$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].metadataLabel,
                                                children: "Created by:"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/ads/review/components/ReviewItemCard.tsx",
                                                lineNumber: 163,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ReviewItemCard$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].metadataValue,
                                                children: item.createdByName
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/ads/review/components/ReviewItemCard.tsx",
                                                lineNumber: 164,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/ads/review/components/ReviewItemCard.tsx",
                                        lineNumber: 162,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ReviewItemCard$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].metadataItem,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ReviewItemCard$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].metadataLabel,
                                                children: "Updated:"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/ads/review/components/ReviewItemCard.tsx",
                                                lineNumber: 167,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ReviewItemCard$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].metadataValue,
                                                children: timeAgo
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/ads/review/components/ReviewItemCard.tsx",
                                                lineNumber: 168,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/ads/review/components/ReviewItemCard.tsx",
                                        lineNumber: 166,
                                        columnNumber: 13
                                    }, this),
                                    item.tags && item.tags.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ReviewItemCard$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].tags,
                                        children: item.tags.map((tag)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ReviewItemCard$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].tag,
                                                children: tag
                                            }, tag, false, {
                                                fileName: "[project]/src/app/ads/review/components/ReviewItemCard.tsx",
                                                lineNumber: 173,
                                                columnNumber: 19
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/review/components/ReviewItemCard.tsx",
                                        lineNumber: 171,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/ads/review/components/ReviewItemCard.tsx",
                                lineNumber: 161,
                                columnNumber: 11
                            }, this),
                            item.comments.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ReviewItemCard$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].commentsIndicator,
                                children: [
                                    "💬 ",
                                    item.comments.length,
                                    ' ',
                                    item.comments.length === 1 ? 'comment' : 'comments'
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/ads/review/components/ReviewItemCard.tsx",
                                lineNumber: 182,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ReviewItemCard$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].actions,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ReviewItemCard$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].viewButton,
                                        onClick: ()=>alert('View details not implemented yet'),
                                        children: "View Details"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/review/components/ReviewItemCard.tsx",
                                        lineNumber: 189,
                                        columnNumber: 13
                                    }, this),
                                    availableActions.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ReviewItemCard$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].actionButtons,
                                        children: availableActions.map(({ action, label, color, requireComment })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ReviewItemCard$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].actionButton,
                                                style: {
                                                    backgroundColor: color
                                                },
                                                onClick: ()=>handleAction(action, requireComment),
                                                disabled: loading,
                                                children: loading ? '...' : label
                                            }, action, false, {
                                                fileName: "[project]/src/app/ads/review/components/ReviewItemCard.tsx",
                                                lineNumber: 199,
                                                columnNumber: 19
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ads/review/components/ReviewItemCard.tsx",
                                        lineNumber: 197,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/ads/review/components/ReviewItemCard.tsx",
                                lineNumber: 188,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/review/components/ReviewItemCard.tsx",
                        lineNumber: 146,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ads/review/components/ReviewItemCard.tsx",
                lineNumber: 135,
                columnNumber: 7
            }, this),
            showCommentModal && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ReviewItemCard$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].modal,
                onClick: ()=>setShowCommentModal(false),
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ReviewItemCard$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].modalContent,
                    onClick: (e)=>e.stopPropagation(),
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ReviewItemCard$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].modalHeader,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                    children: "Add Comment"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/ads/review/components/ReviewItemCard.tsx",
                                    lineNumber: 219,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ReviewItemCard$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].modalClose,
                                    onClick: ()=>setShowCommentModal(false),
                                    children: "✕"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/ads/review/components/ReviewItemCard.tsx",
                                    lineNumber: 220,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/ads/review/components/ReviewItemCard.tsx",
                            lineNumber: 218,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ReviewItemCard$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].modalBody,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    children: "Please provide a reason for this action:"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/ads/review/components/ReviewItemCard.tsx",
                                    lineNumber: 229,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ReviewItemCard$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].commentInput,
                                    value: comment,
                                    onChange: (e)=>setComment(e.target.value),
                                    placeholder: "Enter your comment...",
                                    rows: 4,
                                    autoFocus: true
                                }, void 0, false, {
                                    fileName: "[project]/src/app/ads/review/components/ReviewItemCard.tsx",
                                    lineNumber: 230,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/ads/review/components/ReviewItemCard.tsx",
                            lineNumber: 228,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ReviewItemCard$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].modalFooter,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ReviewItemCard$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].modalCancelButton,
                                    onClick: ()=>{
                                        setComment('');
                                        setShowCommentModal(false);
                                    },
                                    children: "Cancel"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/ads/review/components/ReviewItemCard.tsx",
                                    lineNumber: 241,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ReviewItemCard$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].modalSubmitButton,
                                    onClick: ()=>{
                                        // Re-trigger the action with the comment
                                        setShowCommentModal(false);
                                    // The action will be triggered automatically
                                    },
                                    disabled: !comment.trim(),
                                    children: "Submit"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/ads/review/components/ReviewItemCard.tsx",
                                    lineNumber: 250,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/ads/review/components/ReviewItemCard.tsx",
                            lineNumber: 240,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/ads/review/components/ReviewItemCard.tsx",
                    lineNumber: 217,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/ads/review/components/ReviewItemCard.tsx",
                lineNumber: 216,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true);
}
function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}
}),
"[project]/src/app/ads/review/components/ReviewFilters.module.css [app-ssr] (css module)", ((__turbopack_context__) => {

__turbopack_context__.v({
  "clearButton": "ReviewFilters-module__Z0fMNa__clearButton",
  "clearSection": "ReviewFilters-module__Z0fMNa__clearSection",
  "container": "ReviewFilters-module__Z0fMNa__container",
  "searchInput": "ReviewFilters-module__Z0fMNa__searchInput",
  "section": "ReviewFilters-module__Z0fMNa__section",
  "sectionTitle": "ReviewFilters-module__Z0fMNa__sectionTitle",
  "statusButton": "ReviewFilters-module__Z0fMNa__statusButton",
  "statusButtonActive": "ReviewFilters-module__Z0fMNa__statusButtonActive",
  "statusFilters": "ReviewFilters-module__Z0fMNa__statusFilters",
});
}),
"[project]/src/app/ads/review/components/ReviewFilters.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ReviewFilters",
    ()=>ReviewFilters
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$approval$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/types/approval.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ReviewFilters$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/src/app/ads/review/components/ReviewFilters.module.css [app-ssr] (css module)");
'use client';
;
;
;
function ReviewFilters({ currentFilter, onFilterChange }) {
    const allStatuses = Object.values(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$approval$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ApprovalStatus"]);
    function toggleStatus(status) {
        const currentStatuses = currentFilter.status || [];
        const newStatuses = currentStatuses.includes(status) ? currentStatuses.filter((s)=>s !== status) : [
            ...currentStatuses,
            status
        ];
        onFilterChange({
            status: newStatuses.length > 0 ? newStatuses : undefined
        });
    }
    function clearFilters() {
        onFilterChange({
            status: undefined,
            searchQuery: undefined,
            tags: undefined
        });
    }
    const hasActiveFilters = currentFilter.status && currentFilter.status.length > 0 || currentFilter.searchQuery || currentFilter.tags && currentFilter.tags.length > 0;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ReviewFilters$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].container,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ReviewFilters$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].section,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ReviewFilters$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].sectionTitle,
                        children: "Filter by Status"
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/review/components/ReviewFilters.tsx",
                        lineNumber: 47,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ReviewFilters$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].statusFilters,
                        children: allStatuses.map((status)=>{
                            const isActive = currentFilter.status?.includes(status);
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ReviewFilters$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].statusButton} ${isActive ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ReviewFilters$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].statusButtonActive : ''}`,
                                onClick: ()=>toggleStatus(status),
                                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$approval$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getStatusDisplayName"])(status)
                            }, status, false, {
                                fileName: "[project]/src/app/ads/review/components/ReviewFilters.tsx",
                                lineNumber: 52,
                                columnNumber: 15
                            }, this);
                        })
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/review/components/ReviewFilters.tsx",
                        lineNumber: 48,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ads/review/components/ReviewFilters.tsx",
                lineNumber: 46,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ReviewFilters$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].section,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ReviewFilters$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].sectionTitle,
                        children: "Search"
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/review/components/ReviewFilters.tsx",
                        lineNumber: 67,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "text",
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ReviewFilters$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].searchInput,
                        placeholder: "Search by name or description...",
                        value: currentFilter.searchQuery || '',
                        onChange: (e)=>onFilterChange({
                                searchQuery: e.target.value || undefined
                            })
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/review/components/ReviewFilters.tsx",
                        lineNumber: 68,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ads/review/components/ReviewFilters.tsx",
                lineNumber: 66,
                columnNumber: 7
            }, this),
            hasActiveFilters && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ReviewFilters$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].clearSection,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ReviewFilters$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].clearButton,
                    onClick: clearFilters,
                    children: "Clear All Filters"
                }, void 0, false, {
                    fileName: "[project]/src/app/ads/review/components/ReviewFilters.tsx",
                    lineNumber: 81,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/ads/review/components/ReviewFilters.tsx",
                lineNumber: 80,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/ads/review/components/ReviewFilters.tsx",
        lineNumber: 45,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/app/ads/review/components/ApprovalStats.module.css [app-ssr] (css module)", ((__turbopack_context__) => {

__turbopack_context__.v({
  "container": "ApprovalStats-module__ikRfqG__container",
  "stat": "ApprovalStats-module__ikRfqG__stat",
  "statContent": "ApprovalStats-module__ikRfqG__statContent",
  "statIcon": "ApprovalStats-module__ikRfqG__statIcon",
  "statLabel": "ApprovalStats-module__ikRfqG__statLabel",
  "statValue": "ApprovalStats-module__ikRfqG__statValue",
});
}),
"[project]/src/app/ads/review/components/ApprovalStats.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ApprovalStats",
    ()=>ApprovalStats
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ApprovalStats$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/src/app/ads/review/components/ApprovalStats.module.css [app-ssr] (css module)");
'use client';
;
;
function ApprovalStats({ stats }) {
    const totalItems = stats.totalDraft + stats.totalInReview + stats.totalApproved + stats.totalRejected + stats.totalChangesRequested;
    const avgTimeHours = Math.round(stats.avgTimeToApproval / (1000 * 60 * 60));
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ApprovalStats$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].container,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ApprovalStats$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].stat,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ApprovalStats$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].statIcon,
                        children: "📊"
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/review/components/ApprovalStats.tsx",
                        lineNumber: 29,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ApprovalStats$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].statContent,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ApprovalStats$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].statValue,
                                children: totalItems
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/review/components/ApprovalStats.tsx",
                                lineNumber: 31,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ApprovalStats$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].statLabel,
                                children: "Total Items"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/review/components/ApprovalStats.tsx",
                                lineNumber: 32,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/review/components/ApprovalStats.tsx",
                        lineNumber: 30,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ads/review/components/ApprovalStats.tsx",
                lineNumber: 28,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ApprovalStats$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].stat,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ApprovalStats$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].statIcon,
                        children: "📝"
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/review/components/ApprovalStats.tsx",
                        lineNumber: 37,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ApprovalStats$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].statContent,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ApprovalStats$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].statValue,
                                children: stats.totalDraft
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/review/components/ApprovalStats.tsx",
                                lineNumber: 39,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ApprovalStats$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].statLabel,
                                children: "Draft"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/review/components/ApprovalStats.tsx",
                                lineNumber: 40,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/review/components/ApprovalStats.tsx",
                        lineNumber: 38,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ads/review/components/ApprovalStats.tsx",
                lineNumber: 36,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ApprovalStats$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].stat,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ApprovalStats$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].statIcon,
                        children: "👀"
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/review/components/ApprovalStats.tsx",
                        lineNumber: 45,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ApprovalStats$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].statContent,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ApprovalStats$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].statValue,
                                children: stats.totalInReview
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/review/components/ApprovalStats.tsx",
                                lineNumber: 47,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ApprovalStats$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].statLabel,
                                children: "In Review"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/review/components/ApprovalStats.tsx",
                                lineNumber: 48,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/review/components/ApprovalStats.tsx",
                        lineNumber: 46,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ads/review/components/ApprovalStats.tsx",
                lineNumber: 44,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ApprovalStats$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].stat,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ApprovalStats$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].statIcon,
                        children: "✅"
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/review/components/ApprovalStats.tsx",
                        lineNumber: 53,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ApprovalStats$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].statContent,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ApprovalStats$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].statValue,
                                children: stats.totalApproved
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/review/components/ApprovalStats.tsx",
                                lineNumber: 55,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ApprovalStats$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].statLabel,
                                children: "Approved"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/review/components/ApprovalStats.tsx",
                                lineNumber: 56,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/review/components/ApprovalStats.tsx",
                        lineNumber: 54,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ads/review/components/ApprovalStats.tsx",
                lineNumber: 52,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ApprovalStats$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].stat,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ApprovalStats$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].statIcon,
                        children: "⏱️"
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/review/components/ApprovalStats.tsx",
                        lineNumber: 61,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ApprovalStats$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].statContent,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ApprovalStats$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].statValue,
                                children: avgTimeHours > 0 ? `${avgTimeHours}h` : '-'
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/review/components/ApprovalStats.tsx",
                                lineNumber: 63,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ApprovalStats$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].statLabel,
                                children: "Avg. Approval Time"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/review/components/ApprovalStats.tsx",
                                lineNumber: 66,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/review/components/ApprovalStats.tsx",
                        lineNumber: 62,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ads/review/components/ApprovalStats.tsx",
                lineNumber: 60,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ApprovalStats$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].stat,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ApprovalStats$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].statIcon,
                        children: "📈"
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/review/components/ApprovalStats.tsx",
                        lineNumber: 71,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ApprovalStats$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].statContent,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ApprovalStats$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].statValue,
                                children: stats.approvalRate > 0 ? `${Math.round(stats.approvalRate)}%` : '-'
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/review/components/ApprovalStats.tsx",
                                lineNumber: 73,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ApprovalStats$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].statLabel,
                                children: "Approval Rate"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/review/components/ApprovalStats.tsx",
                                lineNumber: 76,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/review/components/ApprovalStats.tsx",
                        lineNumber: 72,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ads/review/components/ApprovalStats.tsx",
                lineNumber: 70,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/ads/review/components/ApprovalStats.tsx",
        lineNumber: 27,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/app/ads/review/review.module.css [app-ssr] (css module)", ((__turbopack_context__) => {

__turbopack_context__.v({
  "container": "review-module__W8-LxG__container",
  "emptyIcon": "review-module__W8-LxG__emptyIcon",
  "emptyState": "review-module__W8-LxG__emptyState",
  "error": "review-module__W8-LxG__error",
  "header": "review-module__W8-LxG__header",
  "itemsGrid": "review-module__W8-LxG__itemsGrid",
  "itemsHeader": "review-module__W8-LxG__itemsHeader",
  "itemsSection": "review-module__W8-LxG__itemsSection",
  "itemsTitle": "review-module__W8-LxG__itemsTitle",
  "loading": "review-module__W8-LxG__loading",
  "subtitle": "review-module__W8-LxG__subtitle",
  "title": "review-module__W8-LxG__title",
});
}),
"[project]/src/app/ads/review/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ReviewPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
/**
 * ADS-016: Approval Workflow
 * Review page for viewing and managing approval workflow items
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$approval$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/types/approval.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ReviewItemCard$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/ads/review/components/ReviewItemCard.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ReviewFilters$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/ads/review/components/ReviewFilters.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ApprovalStats$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/ads/review/components/ApprovalStats.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$review$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/src/app/ads/review/review.module.css [app-ssr] (css module)");
'use client';
;
;
;
;
;
;
;
function ReviewPage() {
    const [items, setItems] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [stats, setStats] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [filter, setFilter] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        workspaceId: 'default-workspace',
        status: undefined
    });
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    // Load items and stats
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        loadData();
    }, [
        filter
    ]);
    async function loadData() {
        try {
            setLoading(true);
            setError(null);
            // TODO: Replace with actual API calls
            const mockItems = [
                {
                    id: 'ad-001',
                    workspaceId: 'default-workspace',
                    resourceType: 'ad',
                    name: 'Summer Sale Instagram Story',
                    description: 'Promotional ad for summer sale campaign',
                    approvalStatus: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$approval$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ApprovalStatus"].IN_REVIEW,
                    approvalHistory: [],
                    comments: [],
                    createdBy: 'user-1',
                    createdByName: 'John Doe',
                    createdByEmail: 'john@example.com',
                    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
                    submittedForReviewAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
                    submittedForReviewBy: 'user-1',
                    thumbnailUrl: '/placeholder-ad.png',
                    tags: [
                        'instagram',
                        'sale',
                        'summer'
                    ]
                },
                {
                    id: 'ad-002',
                    workspaceId: 'default-workspace',
                    resourceType: 'ad',
                    name: 'Product Launch Facebook Ad',
                    description: 'New product launch announcement',
                    approvalStatus: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$approval$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ApprovalStatus"].DRAFT,
                    approvalHistory: [],
                    comments: [],
                    createdBy: 'user-2',
                    createdByName: 'Jane Smith',
                    createdByEmail: 'jane@example.com',
                    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
                    updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
                    thumbnailUrl: '/placeholder-ad.png',
                    tags: [
                        'facebook',
                        'product',
                        'launch'
                    ]
                },
                {
                    id: 'ad-003',
                    workspaceId: 'default-workspace',
                    resourceType: 'ad',
                    name: 'Holiday Campaign Banner',
                    description: 'Holiday season promotional banner',
                    approvalStatus: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$approval$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ApprovalStatus"].APPROVED,
                    approvalHistory: [],
                    comments: [],
                    createdBy: 'user-1',
                    createdByName: 'John Doe',
                    createdByEmail: 'john@example.com',
                    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                    updatedAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
                    submittedForReviewAt: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
                    submittedForReviewBy: 'user-1',
                    approvedAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
                    approvedBy: 'admin-1',
                    thumbnailUrl: '/placeholder-ad.png',
                    tags: [
                        'banner',
                        'holiday',
                        'campaign'
                    ]
                }
            ];
            const mockStats = {
                totalDraft: 1,
                totalInReview: 1,
                totalApproved: 1,
                totalRejected: 0,
                totalChangesRequested: 0,
                avgTimeToApproval: 2 * 60 * 60 * 1000,
                approvalRate: 100
            };
            // Apply filters
            let filteredItems = mockItems;
            if (filter.status && filter.status.length > 0) {
                filteredItems = mockItems.filter((item)=>filter.status.includes(item.approvalStatus));
            }
            setItems(filteredItems);
            setStats(mockStats);
        } catch (err) {
            console.error('Failed to load data:', err);
            setError('Failed to load approval items. Please try again.');
        } finally{
            setLoading(false);
        }
    }
    function handleFilterChange(newFilter) {
        setFilter((prev)=>({
                ...prev,
                ...newFilter
            }));
    }
    function handleItemUpdated() {
        // Reload data when an item is updated
        loadData();
    }
    if (loading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$review$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].container,
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$review$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].loading,
                children: "Loading..."
            }, void 0, false, {
                fileName: "[project]/src/app/ads/review/page.tsx",
                lineNumber: 143,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/app/ads/review/page.tsx",
            lineNumber: 142,
            columnNumber: 7
        }, this);
    }
    if (error) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$review$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].container,
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$review$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].error,
                children: error
            }, void 0, false, {
                fileName: "[project]/src/app/ads/review/page.tsx",
                lineNumber: 151,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/app/ads/review/page.tsx",
            lineNumber: 150,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$review$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].container,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$review$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].header,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$review$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].title,
                        children: "Approval Workflow"
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/review/page.tsx",
                        lineNumber: 159,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$review$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].subtitle,
                        children: "Review and manage items in the approval workflow"
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/review/page.tsx",
                        lineNumber: 160,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ads/review/page.tsx",
                lineNumber: 158,
                columnNumber: 7
            }, this),
            stats && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ApprovalStats$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ApprovalStats"], {
                stats: stats
            }, void 0, false, {
                fileName: "[project]/src/app/ads/review/page.tsx",
                lineNumber: 165,
                columnNumber: 17
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ReviewFilters$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ReviewFilters"], {
                currentFilter: filter,
                onFilterChange: handleFilterChange
            }, void 0, false, {
                fileName: "[project]/src/app/ads/review/page.tsx",
                lineNumber: 167,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$review$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].itemsSection,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$review$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].itemsHeader,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$review$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].itemsTitle,
                            children: [
                                items.length,
                                " ",
                                items.length === 1 ? 'Item' : 'Items'
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/ads/review/page.tsx",
                            lineNumber: 174,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/review/page.tsx",
                        lineNumber: 173,
                        columnNumber: 9
                    }, this),
                    items.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$review$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].emptyState,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$review$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].emptyIcon,
                                children: "📋"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/review/page.tsx",
                                lineNumber: 181,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                children: "No items found"
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/review/page.tsx",
                                lineNumber: 182,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: "There are no items matching your current filters."
                            }, void 0, false, {
                                fileName: "[project]/src/app/ads/review/page.tsx",
                                lineNumber: 183,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/ads/review/page.tsx",
                        lineNumber: 180,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$review$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].itemsGrid,
                        children: items.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$ads$2f$review$2f$components$2f$ReviewItemCard$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ReviewItemCard"], {
                                item: item,
                                onUpdate: handleItemUpdated
                            }, item.id, false, {
                                fileName: "[project]/src/app/ads/review/page.tsx",
                                lineNumber: 188,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/src/app/ads/review/page.tsx",
                        lineNumber: 186,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ads/review/page.tsx",
                lineNumber: 172,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/ads/review/page.tsx",
        lineNumber: 157,
        columnNumber: 5
    }, this);
}
}),
"[project]/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
else {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    else {
        if ("TURBOPACK compile-time truthy", 1) {
            if ("TURBOPACK compile-time truthy", 1) {
                module.exports = __turbopack_context__.r("[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)");
            } else //TURBOPACK unreachable
            ;
        } else //TURBOPACK unreachable
        ;
    }
} //# sourceMappingURL=module.compiled.js.map
}),
"[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)").vendored['react-ssr'].ReactJsxDevRuntime; //# sourceMappingURL=react-jsx-dev-runtime.js.map
}),
"[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)").vendored['react-ssr'].React; //# sourceMappingURL=react.js.map
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__eecd9242._.js.map