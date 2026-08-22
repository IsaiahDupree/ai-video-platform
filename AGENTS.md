# Repository Agent Rules

## Service and contract discovery

Before changing a service, route, schema, typed model, migration, queue, or
cross-system payload, read `AGENT_SERVICE_CONTRACTS.md`. Regenerate it with
`python3 scripts/generate_agent_service_contracts.py` after contract-surface
changes, and run the same command with `--check` before committing.
