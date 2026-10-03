
## Author

ChessAgine by @jalpp

## Development in Amp orbs

`.agents/setup` uses the orb image's Node.js (22+) and npm, installs the
dependencies from `package-lock.json`, and leaves them ready for Amp's snapshot.
It skips installation when the manifests, toolchain, and setup script match the
saved installation. When installation is needed, it uses a temporary npm cache
to avoid a cached-extraction memory failure observed on a 2 GiB orb.

Start the supervised development server and get its authenticated portal URL:

```sh
amp orb services ensure
```

The web service is declared in `.amp/services.yaml`. Amp supplies its port and
public URL; Next.js permits that specific portal hostname for development assets.
Generated portal links are ignored by Git. No resume hook is needed.

Setup does not provision accounts or store credentials. Clerk can initialize
keyless development mode when the app first runs. For an existing development
instance, configure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` in
Amp project environment/secrets settings. External features also use
`MONGODB_URI`, `AGINE_KEY`, `NN_SERVER_AUTH_TOKEN`, and `THEMES_API_ENDPOINT`.
Use development services, not production credentials. Basic setup does not
require a local database.

Run unit tests with `npm run test:unit -- --runInBand`. The current ts-jest suite
exceeded the 2 GiB orb's available memory during setup verification; use a larger
orb for the full test suite. Stop the dev server with `amp orb service stop web`
when it is not needed.

Changes to these setup files must reach the repository's default branch before
new project orbs can use them. Exact snapshots skip setup entirely; when Amp
reruns setup from a stale snapshot, the dependency check avoids needless installs.

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

You may copy, modify, and distribute this software under the terms of the AGPL-3.0 license.

### Network Use (SaaS)

If you modify this software and run it as a service accessible over a network, you must make the complete corresponding source code of your modified version available to users of that service, as required by the AGPL-3.0.

### Previous Versions

Previous versions of this project were licensed under the GNU General Public License v3.0 (GPL-3.0).
Those versions remain available under GPL-3.0, and you may continue to use them under those terms.

### Third-Party / Legacy Components

Some components (e.g., human evaluation bar calculations) may originate from earlier GPL-licensed code.
Such components remain licensed under GPL-3.0, and redistribution of those specific parts must comply with the GPL-3.0.

### Disclaimer

This program is distributed WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the AGPL-3.0 for more details.
