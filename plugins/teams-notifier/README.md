# Teams Notifier Skill - Portable Setup

This skill enables automatic Teams notifications when Claude Code completes tasks. It's designed to work across all your machines.

## 📦 What's Included

- `SKILL.md` - The skill definition for Claude Code
- `setup.sh` - Setup script for Mac/Linux
- `setup.ps1` - Setup script for Windows
- `README.md` - This file

## 🚀 Quick Setup

### On This Machine (Already Configured)

Your current machine is already set up! The skill is installed in `~/.claude/skills/teams-notifier/`

### On Other Machines

**Option 1: Automatic Setup (Recommended)**

1. Copy this entire directory to the new machine
2. Run the setup script:

   **Windows:**
   ```powershell
   powershell -ExecutionPolicy Bypass -File setup.ps1
   ```

   **Mac/Linux:**
   ```bash
   bash setup.sh
   ```

3. Restart Claude Code

**Option 2: Cloud Sync**

Sync your entire `~/.claude/` directory using:
- OneDrive (already on your machine!)
- Dropbox
- iCloud Drive
- Google Drive

This will sync the skill AND settings across all machines automatically.

**Option 3: Manual Setup**

1. Copy `SKILL.md` to `~/.claude/skills/teams-notifier/` on each machine
2. Add this to `~/.claude/settings.json` on each machine:

   ```json
   {
     "env": {
       "TEAMS_WEBHOOK_URL": "https://677e4c5af462e0c086137c198b4c71.0e.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/1a27d989d2e84a8da6d4ccc034831dc3/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=DNXBGibEsgulLeohjS7zod-OMJS--lJ4Wa8ZEPUR5p8"
     }
   }
   ```

## 📂 Where Files Are Stored

### This Directory (Portable Package)
```
C:\Users\yemishin\.claude\skills\teams-notifier\
├── SKILL.md         # Skill definition
├── setup.sh         # Mac/Linux setup script
├── setup.ps1        # Windows setup script
└── README.md        # This file
```

### Installed Location (Personal Skills)
```
C:\Users\yemishin\.claude\skills\teams-notifier\
└── SKILL.md         # Active skill file
```

This location is the same on all machines: `~/.claude/skills/teams-notifier/`

## 🎯 How to Use

Once installed, the skill works automatically. Claude will send Teams notifications when:
- Tasks are complete
- Features are implemented
- Bugs are fixed
- You explicitly ask for a notification

### Manual Test

To test the notification manually:
```bash
curl -X POST "$TEAMS_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "message": "Testing Teams notification"}'
```

Or simply ask Claude: "Send me a test Teams notification"

## 🔧 Troubleshooting

### Skill not working?

1. **Verify installation:**
   ```bash
   ls ~/.claude/skills/teams-notifier/SKILL.md
   ```

2. **Check environment variable:**
   ```bash
   echo $TEAMS_WEBHOOK_URL
   ```

3. **Restart Claude Code:**
   Exit and restart to load the skill

### Notification not sending?

1. **Test webhook manually:**
   ```bash
   curl -X POST "$TEAMS_WEBHOOK_URL" -H "Content-Type: application/json" -d '{"title":"Test","message":"Hello"}'
   ```

2. **Check Teams channel:**
   - Verify the webhook is still active
   - Check if the channel still exists

3. **Update webhook URL:**
   If you need to update the webhook URL, edit `~/.claude/settings.json` and restart Claude Code

## 🔄 Updating the Skill

To update the skill on all machines:

1. Edit `SKILL.md` with your changes
2. Run the setup script again on each machine
3. Restart Claude Code

## 📝 Notes

- The webhook URL is embedded in the setup scripts for easy deployment
- Personal skills (`~/.claude/skills/`) work across ALL projects
- The skill persists across Claude Code updates
- You can customize the notification format by editing `SKILL.md`

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify the webhook is still active in Teams
3. Test the webhook manually with curl
4. Restart Claude Code after any changes

## 🎉 Success!

You're all set! The Teams notifier skill will now automatically send notifications when tasks are complete across all your machines.
