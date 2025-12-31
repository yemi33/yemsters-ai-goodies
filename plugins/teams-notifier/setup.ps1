# Teams Notifier Skill - Portable Setup Script (PowerShell)
# Run this script on each Windows machine to configure the Teams notification skill

$WebhookUrl = "https://677e4c5af462e0c086137c198b4c71.0e.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/1a27d989d2e84a8da6d4ccc034831dc3/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=DNXBGibEsgulLeohjS7zod-OMJS--lJ4Wa8ZEPUR5p8"
$SettingsFile = "$env:USERPROFILE\.claude\settings.json"
$SkillDir = "$env:USERPROFILE\.claude\skills\teams-notifier"

Write-Host "🚀 Setting up Teams Notifier Skill..." -ForegroundColor Cyan
Write-Host ""

# Create skills directory if it doesn't exist
Write-Host "📁 Creating skills directory..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $SkillDir | Out-Null

# Copy SKILL.md to the personal skills directory
if (Test-Path "SKILL.md") {
    Write-Host "📄 Installing skill file..." -ForegroundColor Yellow
    Copy-Item "SKILL.md" -Destination "$SkillDir\SKILL.md" -Force
} else {
    Write-Host "❌ Error: SKILL.md not found in current directory" -ForegroundColor Red
    exit 1
}

# Configure settings.json
Write-Host "⚙️  Configuring settings..." -ForegroundColor Yellow

if (!(Test-Path $SettingsFile)) {
    # Create new settings file
    $newSettings = @{
        env = @{
            TEAMS_WEBHOOK_URL = $WebhookUrl
        }
    }
    $newSettings | ConvertTo-Json -Depth 10 | Set-Content $SettingsFile
    Write-Host "✅ Created new settings file" -ForegroundColor Green
} else {
    # Update existing settings
    try {
        $settings = Get-Content $SettingsFile -Raw | ConvertFrom-Json

        if (!$settings.env) {
            $settings | Add-Member -MemberType NoteProperty -Name "env" -Value @{} -Force
        }

        $settings.env | Add-Member -MemberType NoteProperty -Name "TEAMS_WEBHOOK_URL" -Value $WebhookUrl -Force

        $settings | ConvertTo-Json -Depth 10 | Set-Content $SettingsFile
        Write-Host "✅ Settings updated successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ Error updating settings: $_" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Restart Claude Code to load the skill"
Write-Host "  2. Test the skill by asking Claude to send a Teams notification"
Write-Host ""
Write-Host "🔄 To install on another machine:" -ForegroundColor Cyan
Write-Host "  1. Copy this directory to the new machine"
Write-Host "  2. Run: powershell -ExecutionPolicy Bypass -File setup.ps1"
Write-Host ""
