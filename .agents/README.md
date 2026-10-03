# Development in Amp orbs

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

Run all Jest projects with `npm test -- --runInBand`, or just unit tests with
`npm run test:unit -- --runInBand`. The suite exceeded the 2 GiB orb's available
memory. Verification on a fresh 3.8 GiB orb completed all tests without an OOM:
216 passed and 1 failed. The failure was an ambiguous `enter your token`
placeholder query in `integrationSetting.test.tsx`. Jest also reported open
handles and required termination after printing its results. These test issues
are separate from orb setup. Stop the dev server with `amp orb service stop web`
when it is not needed to free memory.

Changes to these setup files must reach the repository's default branch before
new project orbs can use them. Exact snapshots skip setup entirely; when Amp
reruns setup from a stale snapshot, the dependency check avoids needless installs.
