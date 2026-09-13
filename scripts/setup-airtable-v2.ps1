$ErrorActionPreference = 'Stop'

$settings = @{}
Get-Content (Join-Path $PSScriptRoot '..\.env') | ForEach-Object {
  if ($_ -match '^([^#][A-Za-z0-9_]*)=(.*)$') {
    $settings[$matches[1]] = $matches[2].Trim()
  }
}

$token = $settings['AIRTABLE_PAT']
$baseId = $settings['AIRTABLE_BASE_ID']
if (-not $token -or -not $baseId) { throw 'AIRTABLE_PAT and AIRTABLE_BASE_ID are required in .env.' }

$headers = @{ Authorization = "Bearer $token"; 'Content-Type' = 'application/json' }
$baseUri = "https://api.airtable.com/v0/meta/bases/$baseId"

function Get-Tables {
  (Invoke-RestMethod -Uri "$baseUri/tables" -Headers $headers -Method Get -TimeoutSec 30).tables
}

function Add-Field([string]$tableName, [hashtable]$field) {
  $tables = Get-Tables
  $table = $tables | Where-Object name -eq $tableName
  if (-not $table) { throw "Table $tableName was not found." }
  if ($table.fields.name -contains $field.name) { return }
  $body = $field | ConvertTo-Json -Depth 8
  Invoke-RestMethod -Uri "$baseUri/tables/$($table.id)/fields" -Headers $headers -Method Post -Body $body -TimeoutSec 30 | Out-Null
}

function Add-Table([string]$tableName, [array]$fields) {
  $tables = Get-Tables
  if ($tables.name -contains $tableName) { return }
  $body = @{ name = $tableName; fields = $fields } | ConvertTo-Json -Depth 8
  Invoke-RestMethod -Uri "$baseUri/tables" -Headers $headers -Method Post -Body $body -TimeoutSec 30 | Out-Null
}

$text = { param($name) @{ name = $name; type = 'singleLineText' } }
$longText = { param($name) @{ name = $name; type = 'multilineText' } }
$number = { param($name, $precision = 0) @{ name = $name; type = 'number'; options = @{ precision = $precision } } }
$checkbox = { param($name) @{ name = $name; type = 'checkbox'; options = @{ icon = 'check'; color = 'greenBright' } } }

Add-Field 'Profiles' (& $text 'Goal')
Add-Field 'Profiles' (& $number 'Current Weight' 1)
Add-Field 'Profiles' (& $text 'Weight Unit')
Add-Field 'Profiles' (& $checkbox 'Daily Weighing')
Add-Field 'Profiles' (& $number 'Sleep Goal Hours' 1)
Add-Field 'Profiles' (& $number 'Cooking Minutes' 0)
Add-Field 'Profiles' (& $text 'Budget')
Add-Field 'Profiles' (& $text 'Animal Protein')
Add-Field 'Profiles' (& $checkbox 'Onboarded')

Add-Field 'Daily Check-ins' (& $number 'Sleep Hours' 1)
Add-Field 'Daily Check-ins' (& $text 'Sleep Quality')
Add-Field 'Daily Check-ins' (& $number 'Meditation Minutes' 0)
Add-Field 'Daily Check-ins' (& $text 'Mood')
Add-Field 'Daily Check-ins' (& $text 'Digestion')

Add-Table 'Weight Logs' @(
  (& $text 'Record Key'),
  (& $text 'Profile Key'),
  (& $text 'Date'),
  (& $number 'Weight' 1),
  (& $text 'Unit'),
  (& $text 'Updated At')
)

Add-Table 'Weekly Plans' @(
  (& $text 'Plan Key'),
  (& $text 'Profile Key'),
  (& $text 'Week Of'),
  (& $text 'Status'),
  (& $text 'Generated At'),
  (& $text 'Updated At')
)

Add-Table 'Planned Meals' @(
  (& $text 'Planned Meal Key'),
  (& $text 'Profile Key'),
  (& $text 'Plan Key'),
  (& $text 'Date'),
  (& $text 'Meal Slot'),
  (& $text 'Recipe Key'),
  (& $checkbox 'Removed'),
  (& $text 'Updated At')
)

Add-Table 'App Events' @(
  (& $text 'Event Key'),
  (& $text 'Profile Key'),
  (& $text 'Category'),
  (& $text 'Event'),
  (& $number 'Value' 1),
  (& $longText 'Details'),
  (& $text 'Created At')
)

Add-Table 'Safety Events' @(
  (& $text 'Event Key'),
  (& $text 'Profile Key'),
  (& $text 'Level'),
  (& $text 'Topic'),
  (& $longText 'Trigger Text'),
  (& $longText 'Guidance Shown'),
  (& $text 'Created At')
)

Write-Output 'Airtable V2 schema is ready.'
