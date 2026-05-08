# Supabase Project Record (Do Not Delete)

This file is a permanent lookup record so the correct Supabase target is always easy to find.

## Project Identity

- Project label: `kirii-port`
- Note: `nano`
- Project ref: `mnshbcvrrzlumfomniim`
- Owner email: `bestinksalesman@gmail.com`

## Dashboard URL

- `https://supabase.com/dashboard/project/mnshbcvrrzlumfomniim`

## MCP Target (Required)

Use this exact MCP configuration for Supabase access:

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=mnshbcvrrzlumfomniim"
    }
  }
}
```

## Quick Verification

If MCP is correctly attached, `get_project_url` should return:

- `https://mnshbcvrrzlumfomniim.supabase.co`
