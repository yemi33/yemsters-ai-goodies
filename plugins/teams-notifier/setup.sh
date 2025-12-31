#!/bin/bash
# Teams Notifier Skill - Portable Setup Script
# Run this script on each machine to configure the Teams notification skill

set -e

WEBHOOK_URL="https://677e4c5af462e0c086137c198b4c71.0e.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/1a27d989d2e84a8da6d4ccc034831dc3/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=DNXBGibEsgulLeohjS7zod-OMJS--lJ4Wa8ZEPUR5p8"
SETTINGS_FILE="$HOME/.claude/settings.json"

echo "🚀 Setting up Teams Notifier Skill..."
echo ""

# Create skills directory if it doesn't exist
echo "📁 Creating skills directory..."
mkdir -p "$HOME/.claude/skills/teams-notifier"

# Copy SKILL.md to the personal skills directory
if [ -f "SKILL.md" ]; then
    echo "📄 Installing skill file..."
    cp SKILL.md "$HOME/.claude/skills/teams-notifier/SKILL.md"
else
    echo "❌ Error: SKILL.md not found in current directory"
    exit 1
fi

# Configure settings.json
echo "⚙️  Configuring settings..."

if [ ! -f "$SETTINGS_FILE" ]; then
    # Create new settings file
    cat > "$SETTINGS_FILE" << 'EOF'
{
  "env": {
    "TEAMS_WEBHOOK_URL": "PLACEHOLDER"
  }
}
EOF
fi

# Update webhook URL in settings
if command -v python3 &> /dev/null; then
    python3 << EOF
import json
import sys

try:
    with open('$SETTINGS_FILE', 'r') as f:
        settings = json.load(f)

    if 'env' not in settings:
        settings['env'] = {}

    settings['env']['TEAMS_WEBHOOK_URL'] = '$WEBHOOK_URL'

    with open('$SETTINGS_FILE', 'w') as f:
        json.dump(settings, f, indent=2)

    print("✅ Settings updated successfully")
except Exception as e:
    print(f"❌ Error updating settings: {e}", file=sys.stderr)
    sys.exit(1)
EOF
else
    echo "⚠️  Python3 not found. Please manually add this to $SETTINGS_FILE:"
    echo ""
    echo '  "env": {'
    echo '    "TEAMS_WEBHOOK_URL": "'$WEBHOOK_URL'"'
    echo '  }'
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Restart Claude Code to load the skill"
echo "  2. Test the skill by asking Claude to send a Teams notification"
echo ""
echo "🔄 To install on another machine:"
echo "  1. Copy this directory to the new machine"
echo "  2. Run: bash setup.sh"
echo ""
