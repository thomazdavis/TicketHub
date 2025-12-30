#!/bin/bash

# --- CONFIGURATION (Change these if you want) ---
USERNAME="admin"
PASSWORD="admin"
EVENT_NAME="CU Football"
VENUE="Folsom Field, Boulder"
EVENT_DATE="2026-01-21T20:00:00"
# ----------------------------------------------

echo "--- STARTING TICKETBLITZ DEMO SETUP ---"

# 1. Register the User (Silently ignore error if they already exist)
echo "1. Registering User: $USERNAME..."
curl -s -o /dev/null -X POST "http://localhost:8080/auth/register" \
     -H "Content-Type: application/json" \
     -d "{\"username\": \"$USERNAME\", \"password\": \"$PASSWORD\"}"

# 2. Promote to Admin (Using Docker direct DB access)
echo "2. Promoting $USERNAME to ADMIN..."
docker exec tickethub-db psql -U user -d tickethub -c "UPDATE users SET role = 'ADMIN' WHERE username = '$USERNAME';" > /dev/null

# 3. Fetch the numeric User ID (Required for API calls)
# We use 'xargs' to trim whitespace from the SQL output
ADMIN_ID=$(docker exec tickethub-db psql -U user -d tickethub -t -c "SELECT id FROM users WHERE username = '$USERNAME';" | xargs)
echo "   -> Admin ID identified as: $ADMIN_ID"

if [ -z "$ADMIN_ID" ]; then
    echo "Error: Could not find user ID. Did the registration fail?"
    exit 1
fi

# 4. Create the Event
echo "3. Creating Event: $EVENT_NAME..."
curl -s -o /dev/null -X POST "http://localhost:8080/admin/create-event?adminUserId=$ADMIN_ID" \
     -H "Content-Type: application/json" \
     -d "{\"name\": \"$EVENT_NAME\", \"venue\": \"$VENUE\", \"date\": \"$EVENT_DATE\"}"

# 5. Fetch the new Event ID
EVENT_ID=$(docker exec tickethub-db psql -U user -d tickethub -t -c "SELECT id FROM events WHERE name = '$EVENT_NAME';" | xargs)
echo "   -> Event ID identified as: $EVENT_ID"

# 6. Generate Seats
echo "4. Generating Seats for Event #$EVENT_ID..."
curl -s -X POST "http://localhost:8080/admin/generate-seats?eventId=$EVENT_ID&adminUserId=$ADMIN_ID"
echo -e "\n"

echo "DEMO READY! Go to http://localhost:5173 and login as $USERNAME"