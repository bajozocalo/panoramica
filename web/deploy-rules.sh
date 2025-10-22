#!/bin/bash

# Panoramica.digital - Firebase Security Rules Deployment Script
# This script helps deploy Firestore and Storage security rules safely

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Function to check if Firebase CLI is installed
check_firebase_cli() {
    if ! command -v firebase &> /dev/null; then
        print_error "Firebase CLI not found"
        print_info "Install it with: npm install -g firebase-tools"
        exit 1
    fi
    print_success "Firebase CLI found"
}

# Function to check if user is logged in
check_firebase_login() {
    if ! firebase projects:list &> /dev/null; then
        print_error "Not logged in to Firebase"
        print_info "Run: firebase login"
        exit 1
    fi
    print_success "Firebase login verified"
}

# Function to validate rules files exist
check_rules_files() {
    local missing_files=()

    if [ ! -f "firestore.rules" ]; then
        missing_files+=("firestore.rules")
    fi

    if [ ! -f "storage.rules" ]; then
        missing_files+=("storage.rules")
    fi

    if [ ! -f "firestore.indexes.json" ]; then
        missing_files+=("firestore.indexes.json")
    fi

    if [ ${#missing_files[@]} -gt 0 ]; then
        print_error "Missing required files:"
        for file in "${missing_files[@]}"; do
            echo "  - $file"
        done
        exit 1
    fi

    print_success "All rules files found"
}

# Function to show current project
show_current_project() {
    local project=$(firebase use 2>&1 | grep "Active Project" | awk '{print $NF}' | tr -d '()')
    if [ -z "$project" ]; then
        project=$(firebase projects:list 2>&1 | grep "^\│.*│" | grep -v "^│ Project" | grep -v "^├" | head -1 | awk -F'│' '{print $2}' | xargs)
    fi

    if [ -n "$project" ]; then
        print_info "Current Firebase project: ${GREEN}$project${NC}"
    else
        print_warning "No Firebase project selected"
        print_info "Run: firebase use <project-id>"
        exit 1
    fi
}

# Function to deploy specific rules
deploy_firestore_rules() {
    print_info "Deploying Firestore security rules..."
    if firebase deploy --only firestore:rules; then
        print_success "Firestore rules deployed successfully"
        return 0
    else
        print_error "Failed to deploy Firestore rules"
        return 1
    fi
}

deploy_storage_rules() {
    print_info "Deploying Storage security rules..."
    if firebase deploy --only storage; then
        print_success "Storage rules deployed successfully"
        return 0
    else
        print_error "Failed to deploy Storage rules"
        return 1
    fi
}

deploy_indexes() {
    print_info "Deploying Firestore indexes..."
    if firebase deploy --only firestore:indexes; then
        print_success "Firestore indexes deployed successfully"
        return 0
    else
        print_error "Failed to deploy Firestore indexes"
        return 1
    fi
}

deploy_all() {
    print_info "Deploying all security rules and indexes..."
    if firebase deploy --only firestore,storage; then
        print_success "All rules and indexes deployed successfully"
        return 0
    else
        print_error "Failed to deploy rules"
        return 1
    fi
}

# Function to show menu
show_menu() {
    echo ""
    echo "=================================="
    echo "  Firebase Rules Deployment"
    echo "=================================="
    echo ""
    echo "What would you like to deploy?"
    echo ""
    echo "  1) Firestore rules only"
    echo "  2) Storage rules only"
    echo "  3) Firestore indexes only"
    echo "  4) All rules and indexes"
    echo "  5) Exit"
    echo ""
}

# Main script
main() {
    clear
    echo ""
    print_info "Panoramica.digital - Security Rules Deployment"
    echo ""

    # Pre-flight checks
    check_firebase_cli
    check_firebase_login
    check_rules_files
    show_current_project

    # If argument provided, deploy that specific target
    if [ $# -gt 0 ]; then
        case "$1" in
            firestore)
                deploy_firestore_rules
                exit $?
                ;;
            storage)
                deploy_storage_rules
                exit $?
                ;;
            indexes)
                deploy_indexes
                exit $?
                ;;
            all)
                deploy_all
                exit $?
                ;;
            *)
                print_error "Invalid argument: $1"
                print_info "Usage: $0 [firestore|storage|indexes|all]"
                exit 1
                ;;
        esac
    fi

    # Interactive mode
    while true; do
        show_menu
        read -p "Select option (1-5): " choice

        case $choice in
            1)
                deploy_firestore_rules
                ;;
            2)
                deploy_storage_rules
                ;;
            3)
                deploy_indexes
                ;;
            4)
                deploy_all
                ;;
            5)
                print_info "Exiting..."
                exit 0
                ;;
            *)
                print_error "Invalid option. Please select 1-5."
                ;;
        esac

        echo ""
        read -p "Press Enter to continue..."
    done
}

# Run main function
main "$@"
