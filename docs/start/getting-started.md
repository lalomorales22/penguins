---
summary: "Get Penguins installed and run your first chat in minutes."
read_when:
  - First time setup from zero
  - You want the fastest path to a working chat
title: "Getting Started"
---

# Getting Started

Goal: go from zero to a first working chat with minimal setup.

<Info>
Fastest chat: open the Control UI (no channel setup needed). Run `penguins dashboard`
and chat in the browser, or open `http://127.0.0.1:18789/` on the
<Tooltip headline="Gateway host" tip="The machine running the Penguins gateway service.">gateway host</Tooltip>.
Docs: [Dashboard](/web/dashboard) and [Control UI](/web/control-ui).
</Info>

## Prereqs

- Node 22 or newer

<Tip>
Check your Node version with `node --version` if you are unsure.
</Tip>

## Quick setup (CLI)

<Steps>
  <Step title="Install Penguins (recommended)">
    <Tabs>
      <Tab title="macOS/Linux">
        ```bash
        curl -fsSL https://penguins.ai/install.sh | bash
        ```
        <img
  src="/assets/install-script.svg"
  alt="Install Script Process"
  className="rounded-lg"
/>
      </Tab>
      <Tab title="Windows (PowerShell)">
        ```powershell
        iwr -useb https://penguins.ai/install.ps1 | iex
        ```
      </Tab>
    </Tabs>

    <Note>
    Other install methods and requirements: [Install](/install).
    </Note>

  </Step>
  <Step title="Run the onboarding wizard">
    ```bash
    penguins onboard --install-daemon
    ```

    The wizard configures auth, your workspace, gateway settings, and the
    recommended local browser workflow.
    See [Onboarding Wizard](/start/wizard) for details.

  </Step>
  <Step title="Check the Gateway">
    If you installed the service, it should already be running:

    ```bash
    penguins gateway status
    ```

  </Step>
  <Step title="Open the Control UI">
    ```bash
    penguins dashboard
    ```
  </Step>
</Steps>

<Check>
If the Control UI loads, your Gateway is ready for use.
</Check>

## Optional checks and extras

<AccordionGroup>
  <Accordion title="Run the Gateway in the foreground">
    Useful for quick tests or troubleshooting.

    ```bash
    penguins gateway --port 18789
    ```

  </Accordion>
  <Accordion title="Print the Control UI URL">
    Useful on headless hosts or over SSH.

    ```bash
    penguins dashboard --no-open
    ```

  </Accordion>
</AccordionGroup>

## Useful environment variables

If you run Penguins as a service account or want custom config/state locations:

- `PENGUINS_HOME` sets the home directory used for internal path resolution.
- `PENGUINS_STATE_DIR` overrides the state directory.
- `PENGUINS_CONFIG_PATH` overrides the config file path.

Full environment variable reference: [Environment vars](/help/environment).

## Go deeper

<Columns>
  <Card title="Onboarding Wizard (details)" href="/start/wizard">
    Full CLI wizard reference and advanced options.
  </Card>
  <Card title="Cloudflare Tunnel" href="/gateway/cloudflare-tunnel">
    Recommended private remote access for the browser UI.
  </Card>
</Columns>

## What you will have

- A running Gateway
- Auth configured
- Local Control UI access

## Next steps

- Private browser access: [Cloudflare Tunnel](/gateway/cloudflare-tunnel)
- Gateway configuration: [Configuration](/gateway/configuration)
- Advanced workflows and from source: [Setup](/start/setup)
