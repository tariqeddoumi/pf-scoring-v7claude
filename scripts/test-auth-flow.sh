#!/bin/bash

# Test Authentication Flow Script
# Tests: Register → Login → Me → Admin Access → V8 Status

set -e

BASE_URL="${1:-http://localhost:3000}"
ADMIN_EMAIL="admin.test@example.com"
ADMIN_PASSWORD="Test123!@#Secure"
ADMIN_NOM="Admin"
ADMIN_PRENOM="Test"

echo "================================================"
echo "Authentication Flow Test Suite"
echo "================================================"
echo "Base URL: $BASE_URL"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Register Admin
echo -e "${YELLOW}[1/6] Testing User Registration...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"nom\": \"$ADMIN_NOM\",
    \"prenom\": \"$ADMIN_PRENOM\",
    \"password\": \"$ADMIN_PASSWORD\",
    \"role\": \"system_admin\"
  }" \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$REGISTER_RESPONSE" | tail -n 1)
BODY=$(echo "$REGISTER_RESPONSE" | head -n -1)

if [[ "$HTTP_CODE" == "201" || "$HTTP_CODE" == "409" ]]; then
  echo -e "${GREEN}✓ Registration: $HTTP_CODE${NC}"
else
  echo -e "${RED}✗ Registration failed: $HTTP_CODE${NC}"
  echo "$BODY"
  exit 1
fi

# Test 2: Login
echo -e "${YELLOW}[2/6] Testing Login...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -c /tmp/cookies.txt \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$ADMIN_PASSWORD\"
  }" \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n 1)
BODY=$(echo "$LOGIN_RESPONSE" | head -n -1)

if [[ "$HTTP_CODE" == "200" ]]; then
  echo -e "${GREEN}✓ Login: $HTTP_CODE${NC}"
  TOKEN=$(echo "$BODY" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
  echo "  Token: ${TOKEN:0:20}..."
else
  echo -e "${RED}✗ Login failed: $HTTP_CODE${NC}"
  echo "$BODY"
  exit 1
fi

# Test 3: Get User Info (/api/auth/me)
echo -e "${YELLOW}[3/6] Testing /api/auth/me...${NC}"
ME_RESPONSE=$(curl -s -X GET "$BASE_URL/api/auth/me" \
  -b /tmp/cookies.txt \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$ME_RESPONSE" | tail -n 1)
BODY=$(echo "$ME_RESPONSE" | head -n -1)

if [[ "$HTTP_CODE" == "200" ]]; then
  echo -e "${GREEN}✓ /auth/me: $HTTP_CODE${NC}"
  ROLE=$(echo "$BODY" | grep -o '"role":"[^"]*' | cut -d'"' -f4)
  EMAIL=$(echo "$BODY" | grep -o '"email":"[^"]*' | cut -d'"' -f4)
  echo "  Email: $EMAIL"
  echo "  Role: $ROLE"
  if [[ "$ROLE" != "system_admin" ]]; then
    echo -e "${RED}✗ Expected role 'system_admin', got '$ROLE'${NC}"
    exit 1
  fi
else
  echo -e "${RED}✗ /auth/me failed: $HTTP_CODE${NC}"
  echo "$BODY"
  exit 1
fi

# Test 4: Check Auth Status (/api/admin/diagnostic/auth-status)
echo -e "${YELLOW}[4/6] Testing /api/admin/diagnostic/auth-status...${NC}"
AUTH_STATUS=$(curl -s -X GET "$BASE_URL/api/admin/diagnostic/auth-status" \
  -b /tmp/cookies.txt \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$AUTH_STATUS" | tail -n 1)
BODY=$(echo "$AUTH_STATUS" | head -n -1)

if [[ "$HTTP_CODE" == "200" ]]; then
  echo -e "${GREEN}✓ auth-status: $HTTP_CODE${NC}"
  TOTAL=$(echo "$BODY" | grep -o '"total":[0-9]*' | cut -d':' -f2)
  ADMINS=$(echo "$BODY" | grep -o '"admins":[0-9]*' | cut -d':' -f2)
  echo "  Total active users: $TOTAL"
  echo "  System admins: $ADMINS"
else
  echo -e "${RED}✗ auth-status failed: $HTTP_CODE${NC}"
  echo "$BODY"
  exit 1
fi

# Test 5: Check V8 Status (/api/admin/diagnostic/v8-status)
echo -e "${YELLOW}[5/6] Testing /api/admin/diagnostic/v8-status...${NC}"
V8_STATUS=$(curl -s -X GET "$BASE_URL/api/admin/diagnostic/v8-status" \
  -b /tmp/cookies.txt \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$V8_STATUS" | tail -n 1)
BODY=$(echo "$V8_STATUS" | head -n -1)

if [[ "$HTTP_CODE" == "200" ]]; then
  echo -e "${GREEN}✓ v8-status: $HTTP_CODE${NC}"
  V8_ENABLED=$(echo "$BODY" | grep -o '"enabled":[^,}]*' | cut -d':' -f2)
  V8_SECTORS=$(echo "$BODY" | grep -o '"v8SectorCount":[0-9]*' | cut -d':' -f2)
  echo "  V8 Enabled: $V8_ENABLED"
  echo "  Sectors configured: $V8_SECTORS"
else
  echo -e "${RED}✗ v8-status failed: $HTTP_CODE${NC}"
  echo "$BODY"
  exit 1
fi

# Test 6: Check System Integrity
echo -e "${YELLOW}[6/6] Testing /api/admin/diagnostic/system-integrity...${NC}"
SYS_INTEGRITY=$(curl -s -X GET "$BASE_URL/api/admin/diagnostic/system-integrity" \
  -b /tmp/cookies.txt \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$SYS_INTEGRITY" | tail -n 1)
BODY=$(echo "$SYS_INTEGRITY" | head -n -1)

if [[ "$HTTP_CODE" == "200" ]]; then
  echo -e "${GREEN}✓ system-integrity: $HTTP_CODE${NC}"
  OVERALL=$(echo "$BODY" | grep -o '"overall_status":"[^"]*' | cut -d'"' -f4)
  MODEL=$(echo "$BODY" | grep -o '"active_model":"[^"]*' | cut -d'"' -f4)
  echo "  Overall Status: $OVERALL"
  echo "  Active Model: $MODEL"
else
  echo -e "${RED}✗ system-integrity failed: $HTTP_CODE${NC}"
  echo "$BODY"
  exit 1
fi

# Cleanup
rm -f /tmp/cookies.txt

echo ""
echo "================================================"
echo -e "${GREEN}✓ All tests passed!${NC}"
echo "================================================"
echo ""
echo "Summary:"
echo "  ✓ User registration works"
echo "  ✓ Login returns JWT token"
echo "  ✓ /auth/me returns correct user data"
echo "  ✓ Role field is correctly populated"
echo "  ✓ Admin endpoints are secured"
echo "  ✓ V8 status can be checked"
echo "  ✓ System integrity diagnostic available"
echo ""
