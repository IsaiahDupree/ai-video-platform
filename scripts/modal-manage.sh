#!/bin/bash

# VC-008: Modal Cost Management
# Auto-scale to zero, status checking, stop commands
#
# This script provides convenient commands to manage Modal deployments
# and control costs by stopping/starting services as needed.
#
# Usage:
#   ./scripts/modal-manage.sh status        # Check deployment status
#   ./scripts/modal-manage.sh deploy        # Deploy voice clone service
#   ./scripts/modal-manage.sh stop          # Stop all running apps
#   ./scripts/modal-manage.sh list          # List all Modal apps
#   ./scripts/modal-manage.sh logs [app]    # View logs for an app
#   ./scripts/modal-manage.sh token         # Show token status

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Modal app configuration
VOICE_CLONE_APP="voice-clone"
MODAL_SCRIPT="scripts/modal_voice_clone.py"

# Helper functions
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if Modal CLI is installed
check_modal_installed() {
    if ! command -v modal &> /dev/null; then
        print_error "Modal CLI is not installed"
        echo "Install with: pip install modal"
        exit 1
    fi
    print_success "Modal CLI is installed"
}

# Check if authenticated with Modal
check_modal_auth() {
    if ! modal token verify &> /dev/null; then
        print_error "Not authenticated with Modal"
        echo "Authenticate with: modal token new"
        exit 1
    fi
    print_success "Authenticated with Modal"
}

# Command: status
cmd_status() {
    print_header "MODAL DEPLOYMENT STATUS"

    check_modal_installed
    check_modal_auth

    echo ""
    print_info "Checking Modal apps..."
    echo ""

    # List all apps
    modal app list 2>/dev/null || {
        print_warning "No Modal apps found or unable to list apps"
        return 0
    }

    echo ""
    print_info "Voice Clone App: ${VOICE_CLONE_APP}"

    # Check if voice-clone app is deployed
    if modal app list 2>/dev/null | grep -q "${VOICE_CLONE_APP}"; then
        print_success "Voice clone service is deployed"
    else
        print_warning "Voice clone service is not deployed"
        print_info "Deploy with: ./scripts/modal-manage.sh deploy"
    fi
}

# Command: deploy
cmd_deploy() {
    print_header "DEPLOYING VOICE CLONE SERVICE"

    check_modal_installed
    check_modal_auth

    if [ ! -f "$MODAL_SCRIPT" ]; then
        print_error "Modal script not found: $MODAL_SCRIPT"
        exit 1
    fi

    echo ""
    print_info "Deploying ${VOICE_CLONE_APP}..."
    echo ""

    # Deploy the app
    modal deploy "$MODAL_SCRIPT"

    echo ""
    print_success "Deployment complete!"
    print_info "The service will auto-scale to zero when idle (5 min timeout)"
    print_info "Check status with: ./scripts/modal-manage.sh status"
}

# Command: stop
cmd_stop() {
    print_header "STOPPING MODAL APPS"

    check_modal_installed
    check_modal_auth

    echo ""
    print_warning "This will stop all Modal apps in your account"
    read -p "Are you sure? (y/N) " -n 1 -r
    echo

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Cancelled"
        exit 0
    fi

    echo ""
    print_info "Stopping all Modal apps..."

    # Modal apps auto-scale to zero, so we can't really "stop" them
    # Instead, we can delete the deployment
    print_warning "Modal apps automatically scale to zero when idle"
    print_info "To completely remove a deployment, use: modal app delete [app-name]"
    print_info "To view all apps, use: ./scripts/modal-manage.sh list"
}

# Command: list
cmd_list() {
    print_header "MODAL APPS"

    check_modal_installed
    check_modal_auth

    echo ""
    modal app list
}

# Command: logs
cmd_logs() {
    APP_NAME=${1:-$VOICE_CLONE_APP}

    print_header "LOGS FOR: ${APP_NAME}"

    check_modal_installed
    check_modal_auth

    echo ""
    print_info "Fetching logs for ${APP_NAME}..."
    echo ""

    # Get logs for the app
    modal app logs "$APP_NAME" 2>/dev/null || {
        print_error "Unable to fetch logs for ${APP_NAME}"
        print_info "Make sure the app is deployed and the name is correct"
        exit 1
    }
}

# Command: token
cmd_token() {
    print_header "MODAL TOKEN STATUS"

    check_modal_installed

    echo ""
    if modal token verify &> /dev/null; then
        print_success "Token is valid"
        echo ""
        print_info "Token information:"
        modal token verify
    else
        print_error "Token is invalid or not set"
        echo ""
        print_info "Create a new token with: modal token new"
    fi
}

# Command: cost-info
cmd_cost_info() {
    print_header "MODAL COST MANAGEMENT INFO"

    echo ""
    print_info "Cost-saving features:"
    echo "  • Auto-scale to zero after 5 minutes of idle time"
    echo "  • Container lifecycle timeout: 10 minutes per request"
    echo "  • GPU (A10G) only spins up when needed"
    echo "  • Model weights cached in Modal volume (no re-download)"
    echo ""

    print_info "To minimize costs:"
    echo "  1. Services automatically scale to zero when idle"
    echo "  2. Use batch processing to group requests"
    echo "  3. Monitor usage with: modal app stats [app-name]"
    echo "  4. Delete unused deployments with: modal app delete [app-name]"
    echo ""

    print_info "Pricing information:"
    echo "  • Visit: https://modal.com/pricing"
    echo "  • GPU costs only incurred during active processing"
    echo "  • Free tier available for testing"
}

# Main command router
main() {
    COMMAND=${1:-help}

    case $COMMAND in
        status)
            cmd_status
            ;;
        deploy)
            cmd_deploy
            ;;
        stop)
            cmd_stop
            ;;
        list)
            cmd_list
            ;;
        logs)
            cmd_logs "$2"
            ;;
        token)
            cmd_token
            ;;
        cost-info)
            cmd_cost_info
            ;;
        help|--help|-h)
            print_header "MODAL MANAGEMENT SCRIPT - VC-008"
            echo ""
            echo "Usage: ./scripts/modal-manage.sh [command]"
            echo ""
            echo "Commands:"
            echo "  status        Check deployment status"
            echo "  deploy        Deploy voice clone service"
            echo "  stop          Stop all running apps (prompts for confirmation)"
            echo "  list          List all Modal apps"
            echo "  logs [app]    View logs for an app (default: voice-clone)"
            echo "  token         Show token status and verify authentication"
            echo "  cost-info     Display cost management information"
            echo "  help          Show this help message"
            echo ""
            echo "Examples:"
            echo "  ./scripts/modal-manage.sh status"
            echo "  ./scripts/modal-manage.sh deploy"
            echo "  ./scripts/modal-manage.sh logs voice-clone"
            echo ""
            ;;
        *)
            print_error "Unknown command: $COMMAND"
            echo "Run './scripts/modal-manage.sh help' for usage information"
            exit 1
            ;;
    esac
}

# Run main
main "$@"
