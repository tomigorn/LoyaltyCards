# Sync & Multi-User — Phase A (Backend + Infra) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a self-hosted Pocketbase backend that stores per-account loyalty cards (data only) with strict owner isolation and authenticator-app (TOTP) two-factor auth, ready for the PWA to sync against.

**Architecture:** Pocketbase compiled as a custom Go binary (so we can add TOTP routes with a real OTP library and embed schema migrations). One Docker container with a persisted `pb_data` volume, fronted later by Traefik + Cloudflare. Schema (the `cards` collection + extra `users` fields) is defined as Go migrations that compile into the binary; TOTP is implemented with `github.com/pquerna/otp` (SHA-1, Google-Authenticator compatible). Owner isolation is enforced declaratively by Pocketbase collection API rules and verified by Go tests.

**Tech Stack:** Go, Pocketbase (as a framework, `github.com/pocketbase/pocketbase`), `github.com/pquerna/otp`, Docker (multi-stage), Traefik, Cloudflare Tunnel.

**Reference spec:** `docs/superpowers/specs/2026-06-05-sync-multiuser-design.md` (this repo).

> **Pocketbase version note:** Pocketbase's Go API has shifted between minor versions. This plan targets the v0.23+ API (`core.NewBaseCollection`, `app.OnServe().BindFunc`, `tests.NewTestApp`). The exact version is pinned in `go.mod` at build time via `go get github.com/pocketbase/pocketbase@latest`. If a symbol named here doesn't exist in the pinned version, consult `https://pkg.go.dev/github.com/pocketbase/pocketbase@<pinned>` and adjust — the Go tests in each task are the safety net that catches a wrong symbol immediately.

> **Where this work lives:** the backend is a NEW project at `/home/pi/Projects/Docker/LoyaltyCards-Sync/` (its own git context under the homelab repo). It is NOT part of the PWA repo. All paths below are absolute.

> **Outward-facing guardrail:** Tasks 1–7 build and test entirely locally. Task 8 (live Traefik route + Cloudflare hostname + public deploy) is USER-GATED — prepare the config files and hand them to the user; do not apply changes to live infra or push the homelab infra repo without explicit confirmation.

---

## File Structure

All under `/home/pi/Projects/Docker/LoyaltyCards-Sync/`:

- `go.mod`, `go.sum` — Go module `loyaltycards-sync`; pins Pocketbase + otp.
- `main.go` — entrypoint: `pocketbase.New()`, registers migrations + TOTP routes, runs.
- `totp.go` — TOTP route handlers + helpers (setup/enable/disable/required/login).
- `totp_test.go` — unit/integration tests for the TOTP handlers.
- `rules_test.go` — owner-isolation tests against the `cards` collection.
- `migrations/1_init_schema.go` — Go migration: `cards` collection (fields, unique index, owner rules) + extra `users` fields.
- `Dockerfile` — multi-stage: build the Go binary, copy into a slim runtime image.
- `docker-compose.yaml` — the `loyalty-sync` service + `pb_data` volume, on `traefik_proxy`.
- `.env.example`, `.env`, `.gitignore` — per the homelab sample structure.
- `README.md` — wiring + admin bootstrap notes.
- `deploy/loyalty-sync.yml` — Traefik dynamic config to hand to the user (Task 8).

---

## Prerequisites

- [ ] **Step 0: Verify toolchain**

Run:
```bash
go version        # expect go1.21+ ; install if missing
docker version
```
Expected: both print versions. If Go is missing, install it before continuing (the Docker build does not need a host Go, but the TDD test loop in Tasks 3–6 runs `go test` on the host).

---

## Task 1: Project scaffold (compose, env, gitignore)

**Files:**
- Create: `/home/pi/Projects/Docker/LoyaltyCards-Sync/docker-compose.yaml`
- Create: `/home/pi/Projects/Docker/LoyaltyCards-Sync/.env.example`
- Create: `/home/pi/Projects/Docker/LoyaltyCards-Sync/.env`
- Create: `/home/pi/Projects/Docker/LoyaltyCards-Sync/.gitignore`

- [ ] **Step 1: Write `.gitignore`** (copy the homelab sample, plus uncomment data dir)

```gitignore
# Environment files (contain secrets) — keep .env.example tracked
.env
.env.*
!.env.example

# Keys & certificates
*.key
*.pem
*.crt
*.cert
*.csr
*.p12
*.pfx

# Credentials, secrets & tokens
secrets/
*.secret
*.token
credentials.json
auth.json

# Logs
*.log

# Pocketbase runtime data (DB, uploaded files, logs)
pb_data/

# Go build output
/loyaltycards-sync
```

- [ ] **Step 2: Write `.env.example`**

```dotenv
COMPOSE_PROJECT_NAME=loyaltycards-sync
# Pocketbase superuser (admin console). Set real values in .env, never commit them.
PB_ADMIN_EMAIL=
PB_ADMIN_PASSWORD=
# Public origin the PWA will call (used for OAuth2 redirect + CORS), e.g. https://loyalty-sync.holy-grail.ch
PB_PUBLIC_URL=
# Google OAuth2 (create credentials in Google Cloud console; redirect URL = <PB_PUBLIC_URL>/api/oauth2-redirect)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

- [ ] **Step 3: Write `.env`** (real values; gitignored)

```dotenv
COMPOSE_PROJECT_NAME=loyaltycards-sync
PB_ADMIN_EMAIL=admin@holy-grail.ch
PB_ADMIN_PASSWORD=<generate a long random password>
PB_PUBLIC_URL=https://loyalty-sync.holy-grail.ch
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```
Generate the password with `openssl rand -base64 24`. Leave Google values blank for now (filled when OAuth is configured; password+TOTP login works without them).

- [ ] **Step 4: Write `docker-compose.yaml`** (follow the homelab sectioned layout)

```yaml
# #########################################################
# Services ################################################
# #########################################################
services:
# ---------------------------------------------------------
# LoyaltyCards-Sync (Pocketbase) --------------------------
# ---------------------------------------------------------
  loyalty-sync:
    build: .
    image: loyaltycards-sync:local
    container_name: loyalty-sync
    restart: unless-stopped
    environment:
      - PB_ADMIN_EMAIL=${PB_ADMIN_EMAIL}
      - PB_ADMIN_PASSWORD=${PB_ADMIN_PASSWORD}
      - PB_PUBLIC_URL=${PB_PUBLIC_URL}
    volumes:
      - pb_data:/pb/pb_data
    networks:
      - traefik_proxy

# #########################################################
# Networks ################################################
# #########################################################
networks:
  traefik_proxy:
    external: true

# #########################################################
# Volumes #################################################
# #########################################################
volumes:
  pb_data:
```

- [ ] **Step 5: Verify compose parses**

Run: `cd /home/pi/Projects/Docker/LoyaltyCards-Sync && docker compose config >/dev/null && echo OK`
Expected: prints `OK` (build context warning is fine; the Dockerfile arrives in Task 2).

- [ ] **Step 6: Commit**

```bash
cd /home/pi/Projects/Docker/LoyaltyCards-Sync
git add -A && git commit -m "LoyaltyCards-Sync: scaffold Pocketbase project (compose, env, gitignore)"
```
(Commit from the homelab repo root if this dir is tracked there; use the repo's working directory. Do NOT push — Task 8 / user controls infra pushes.)

---

## Task 2: Minimal Pocketbase binary + Dockerfile (boots and serves health)

**Files:**
- Create: `/home/pi/Projects/Docker/LoyaltyCards-Sync/go.mod`
- Create: `/home/pi/Projects/Docker/LoyaltyCards-Sync/main.go`
- Create: `/home/pi/Projects/Docker/LoyaltyCards-Sync/Dockerfile`

- [ ] **Step 1: Init the Go module and add deps**

Run:
```bash
cd /home/pi/Projects/Docker/LoyaltyCards-Sync
go mod init loyaltycards-sync
go get github.com/pocketbase/pocketbase@latest
go get github.com/pquerna/otp@latest
```
Expected: `go.mod`/`go.sum` created with both deps.

- [ ] **Step 2: Write a minimal `main.go`** (boots Pocketbase, auto-applies Go migrations, auto-creates admin from env)

```go
package main

import (
	"log"
	"os"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/plugins/migratecmd"

	_ "loyaltycards-sync/migrations" // side-effect: registers Go migrations
)

func main() {
	app := pocketbase.New()

	// Apply embedded Go migrations automatically on start.
	migratecmd.MustRegister(app, app.RootCmd, migratecmd.Config{Automigrate: true})

	// Ensure a superuser exists (idempotent) from env, so the container is self-bootstrapping.
	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		ensureSuperuser(app)
		registerTOTPRoutes(se) // defined in totp.go
		return se.Next()
	})

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}

func ensureSuperuser(app core.App) {
	email := os.Getenv("PB_ADMIN_EMAIL")
	password := os.Getenv("PB_ADMIN_PASSWORD")
	if email == "" || password == "" {
		return
	}
	col, err := app.FindCollectionByNameOrId(core.CollectionNameSuperusers)
	if err != nil {
		return
	}
	if _, err := app.FindAuthRecordByEmail(core.CollectionNameSuperusers, email); err == nil {
		return // already exists
	}
	rec := core.NewRecord(col)
	rec.SetEmail(email)
	rec.SetPassword(password)
	if err := app.Save(rec); err != nil {
		log.Printf("ensureSuperuser: %v", err)
	}
}
```

> If `registerTOTPRoutes`/`ensureSuperuser` symbol names differ from the pinned API (e.g. `core.CollectionNameSuperusers`), adjust per the version's docs. A temporary stub `func registerTOTPRoutes(se *core.ServeEvent) {}` in `totp.go` lets this compile until Task 4.

- [ ] **Step 3: Add a temporary stub so it compiles**

Create `/home/pi/Projects/Docker/LoyaltyCards-Sync/totp.go`:
```go
package main

import "github.com/pocketbase/pocketbase/core"

// Replaced with real handlers in Task 4.
func registerTOTPRoutes(se *core.ServeEvent) {}
```

- [ ] **Step 4: Add the migrations stub package** so `main.go` imports cleanly

Create `/home/pi/Projects/Docker/LoyaltyCards-Sync/migrations/0_doc.go`:
```go
// Package migrations holds Pocketbase Go schema migrations, applied automatically on boot.
package migrations
```

- [ ] **Step 5: Build to verify it compiles**

Run: `cd /home/pi/Projects/Docker/LoyaltyCards-Sync && go build ./... && echo BUILD_OK`
Expected: prints `BUILD_OK`.

- [ ] **Step 6: Write the multi-stage `Dockerfile`**

```dockerfile
# ---- build ----
FROM golang:1.22-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /pb/loyaltycards-sync .

# ---- runtime ----
FROM alpine:3.20
RUN apk add --no-cache ca-certificates
WORKDIR /pb
COPY --from=build /pb/loyaltycards-sync /pb/loyaltycards-sync
EXPOSE 8090
# Bind to all interfaces inside the container; Traefik talks to it over the proxy net.
ENTRYPOINT ["/pb/loyaltycards-sync", "serve", "--http=0.0.0.0:8090"]
```

- [ ] **Step 7: Build the image and smoke-test health**

Run:
```bash
cd /home/pi/Projects/Docker/LoyaltyCards-Sync
docker compose build
docker compose up -d
sleep 4
curl -sS -o /dev/null -w "health: %{http_code}\n" http://localhost:8090/api/health || \
  docker run --rm --network loyaltycards-sync_default alpine:3.20 sh -c 'apk add -q curl && curl -s loyalty-sync:8090/api/health'
docker compose logs --tail=20 loyalty-sync
```
Expected: `/api/health` returns HTTP 200 with `{"code":200,...}`. (If port 8090 isn't published to the host, the in-network curl fallback proves it.)

> Optional: to reach the admin UI locally, temporarily add `ports: ["8090:8090"]` under the service, then remove it before deploy (production exposure is via Traefik only).

- [ ] **Step 8: Tear down and commit**

```bash
docker compose down
cd /home/pi/Projects/Docker/LoyaltyCards-Sync
git add -A && git commit -m "LoyaltyCards-Sync: minimal Pocketbase binary + Dockerfile (serves /api/health)"
```

---

## Task 3: `cards` collection + `users` fields + owner-isolation rules (migration, TDD)

**Files:**
- Modify: `/home/pi/Projects/Docker/LoyaltyCards-Sync/migrations/1_init_schema.go` (create)
- Test: `/home/pi/Projects/Docker/LoyaltyCards-Sync/rules_test.go` (create)

- [ ] **Step 1: Write the failing test** (`rules_test.go`)

This boots a throwaway test app with the migrations applied, creates two users + a card owned by user A, and asserts user B cannot read it.

```go
package main

import (
	"net/http"
	"testing"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tests"
)

// helper: make a verified auth user in the "users" collection
func makeUser(t *testing.T, app core.App, email string) *core.Record {
	col, err := app.FindCollectionByNameOrId("users")
	if err != nil {
		t.Fatalf("users collection missing: %v", err)
	}
	u := core.NewRecord(col)
	u.SetEmail(email)
	u.SetPassword("password123")
	u.Set("verified", true)
	if err := app.Save(u); err != nil {
		t.Fatalf("save user: %v", err)
	}
	return u
}

func TestCardsCollectionExistsWithOwnerRules(t *testing.T) {
	app, err := tests.NewTestApp()
	if err != nil {
		t.Fatal(err)
	}
	defer app.Cleanup()

	col, err := app.FindCollectionByNameOrId("cards")
	if err != nil {
		t.Fatalf("cards collection should exist: %v", err)
	}
	if col.ListRule == nil || *col.ListRule != "@request.auth.id != \"\" && owner = @request.auth.id" {
		t.Fatalf("cards ListRule not owner-scoped: %v", col.ListRule)
	}
}

func TestUserCannotReadAnothersCard(t *testing.T) {
	app, err := tests.NewTestApp()
	if err != nil {
		t.Fatal(err)
	}
	defer app.Cleanup()

	userA := makeUser(t, app, "a@example.com")
	makeUser(t, app, "b@example.com")

	cardsCol, _ := app.FindCollectionByNameOrId("cards")
	card := core.NewRecord(cardsCol)
	card.Set("owner", userA.Id)
	card.Set("cardId", "uuid-a-1")
	card.Set("storeName", "Migros")
	card.Set("barcodeValue", "7613269001234")
	card.Set("barcodeFormat", "ean13")
	if err := app.Save(card); err != nil {
		t.Fatalf("save card: %v", err)
	}

	// As user B, the API list must not return user A's card.
	// (Use the HTTP test harness with B's auth token.)
	rec := tests.ApiScenario{
		Name:   "user B lists cards",
		Method: http.MethodGet,
		URL:    "/api/collections/cards/records",
		Headers: map[string]string{
			"Authorization": authToken(t, app, "b@example.com"),
		},
		ExpectedStatus:  200,
		ExpectedContent: []string{"\"totalItems\":0"},
		TestAppFactory:  func(t testing.TB) *tests.TestApp { return app },
	}
	rec.Test(t)
}
```

Add the `authToken` helper at the bottom of `rules_test.go`:
```go
func authToken(t *testing.T, app core.App, email string) string {
	u, err := app.FindAuthRecordByEmail("users", email)
	if err != nil {
		t.Fatalf("find user %s: %v", email, err)
	}
	tok, err := u.NewAuthToken()
	if err != nil {
		t.Fatalf("token: %v", err)
	}
	return tok
}
```

> `tests.ApiScenario` field names (`TestAppFactory`, `ExpectedContent`) match the v0.23+ harness; verify against the pinned version and adjust if needed.

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd /home/pi/Projects/Docker/LoyaltyCards-Sync && go test ./... -run TestCards -v`
Expected: FAIL — `cards collection should exist` (no migration yet).

- [ ] **Step 3: Write the migration** (`migrations/1_init_schema.go`)

```go
package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/tools/types"
)

func init() {
	m.Register(func(app core.App) error {
		// --- extra fields on the built-in users auth collection ---
		users, err := app.FindCollectionByNameOrId("users")
		if err != nil {
			return err
		}
		users.Fields.Add(&core.TextField{Name: "totpSecret", Hidden: true})
		users.Fields.Add(&core.TextField{Name: "totpPending", Hidden: true})
		users.Fields.Add(&core.BoolField{Name: "totpEnabled"})
		if err := app.Save(users); err != nil {
			return err
		}

		// --- cards collection ---
		cards := core.NewBaseCollection("cards")
		cards.Fields.Add(
			&core.RelationField{Name: "owner", Required: true, MaxSelect: 1,
				CollectionId: users.Id, CascadeDelete: true},
			&core.TextField{Name: "cardId", Required: true},
			&core.TextField{Name: "storeName", Required: true},
			&core.TextField{Name: "barcodeValue"},
			&core.TextField{Name: "barcodeFormat"},
			&core.TextField{Name: "brandColor"},
			&core.TextField{Name: "tileColor"},
			&core.TextField{Name: "logoSource"},
			&core.TextField{Name: "logoUrl"},
			&core.TextField{Name: "catalogId"},
			&core.TextField{Name: "notes"},
			&core.BoolField{Name: "favorite"},
			&core.NumberField{Name: "order"},
			&core.NumberField{Name: "lastUsedAt"},
			&core.NumberField{Name: "clientCreatedAt"},
			&core.NumberField{Name: "clientUpdatedAt"},
			&core.BoolField{Name: "deleted"},
		)
		// one row per (owner, cardId)
		cards.AddIndex("idx_cards_owner_cardId", true, "owner, cardId", "")

		ownerRule := "@request.auth.id != \"\" && owner = @request.auth.id"
		cards.ListRule = types.Pointer(ownerRule)
		cards.ViewRule = types.Pointer(ownerRule)
		cards.CreateRule = types.Pointer(ownerRule)
		cards.UpdateRule = types.Pointer(ownerRule)
		cards.DeleteRule = types.Pointer(ownerRule)

		return app.Save(cards)
	}, func(app core.App) error {
		if c, err := app.FindCollectionByNameOrId("cards"); err == nil {
			_ = app.Delete(c)
		}
		return nil
	})
}
```

> `clientCreatedAt`/`clientUpdatedAt` are the client's epoch-ms timestamps used for last-write-wins (Pocketbase also keeps its own `created`/`updated`; we keep ours separate to avoid clock ambiguity).

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd /home/pi/Projects/Docker/LoyaltyCards-Sync && go test ./... -run 'TestCards|TestUserCannot' -v`
Expected: PASS (both).

- [ ] **Step 5: Commit**

```bash
cd /home/pi/Projects/Docker/LoyaltyCards-Sync
git add migrations/1_init_schema.go rules_test.go
git commit -m "LoyaltyCards-Sync: cards collection with owner-isolation rules + users TOTP fields"
```

---

## Task 4: TOTP enroll/enable/disable (TDD)

**Files:**
- Modify: `/home/pi/Projects/Docker/LoyaltyCards-Sync/totp.go` (replace stub)
- Test: `/home/pi/Projects/Docker/LoyaltyCards-Sync/totp_test.go` (create)

- [ ] **Step 1: Write the failing test** (`totp_test.go`) — enroll then enable with a generated code

```go
package main

import (
	"testing"
	"time"

	"github.com/pquerna/otp/totp"
)

// pure-helper test first: our wrappers must round-trip with pquerna/otp.
func TestTotpGenerateAndValidate(t *testing.T) {
	secret, _, err := totpEnroll("user@example.com")
	if err != nil {
		t.Fatal(err)
	}
	code, err := totp.GenerateCode(secret, time.Now())
	if err != nil {
		t.Fatal(err)
	}
	if !totpValidate(secret, code) {
		t.Fatalf("freshly generated code should validate")
	}
	if totpValidate(secret, "000000") {
		t.Fatalf("wrong code must not validate")
	}
}
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd /home/pi/Projects/Docker/LoyaltyCards-Sync && go test ./... -run TestTotpGenerate -v`
Expected: FAIL — `totpEnroll`/`totpValidate` undefined.

- [ ] **Step 3: Implement the TOTP helpers + routes** (`totp.go`, replacing the stub)

```go
package main

import (
	"net/http"
	"time"

	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pquerna/otp/totp"
)

const totpIssuer = "LoyaltyCards"

// totpEnroll returns a new secret and its otpauth:// provisioning URI (for QR display).
func totpEnroll(account string) (secret string, otpauthURL string, err error) {
	key, err := totp.Generate(totp.GenerateOpts{Issuer: totpIssuer, AccountName: account})
	if err != nil {
		return "", "", err
	}
	return key.Secret(), key.URL(), nil
}

func totpValidate(secret, code string) bool {
	return totp.Validate(code, secret)
}

func registerTOTPRoutes(se *core.ServeEvent) {
	g := se.Router.Group("/api/loyalty/totp")

	// setup: requires auth; stashes a pending secret and returns it + QR URI.
	g.POST("/setup", func(e *core.RequestEvent) error {
		user := e.Auth
		if user == nil {
			return apis.NewUnauthorizedError("auth required", nil)
		}
		secret, url, err := totpEnroll(user.Email())
		if err != nil {
			return err
		}
		user.Set("totpPending", secret)
		if err := e.App.Save(user); err != nil {
			return err
		}
		return e.JSON(http.StatusOK, map[string]string{"secret": secret, "otpauthUrl": url})
	}).Bind(apis.RequireAuth())

	// enable: confirm a code against the pending secret, promote it.
	g.POST("/enable", func(e *core.RequestEvent) error {
		user := e.Auth
		if user == nil {
			return apis.NewUnauthorizedError("auth required", nil)
		}
		var body struct{ Code string `json:"code"` }
		if err := e.BindBody(&body); err != nil {
			return err
		}
		pending := user.GetString("totpPending")
		if pending == "" || !totpValidate(pending, body.Code) {
			return apis.NewBadRequestError("invalid code", nil)
		}
		user.Set("totpSecret", pending)
		user.Set("totpPending", "")
		user.Set("totpEnabled", true)
		if err := e.App.Save(user); err != nil {
			return err
		}
		return e.JSON(http.StatusOK, map[string]bool{"enabled": true})
	}).Bind(apis.RequireAuth())

	// disable: requires a valid current code.
	g.POST("/disable", func(e *core.RequestEvent) error {
		user := e.Auth
		if user == nil {
			return apis.NewUnauthorizedError("auth required", nil)
		}
		var body struct{ Code string `json:"code"` }
		if err := e.BindBody(&body); err != nil {
			return err
		}
		if !user.GetBool("totpEnabled") || !totpValidate(user.GetString("totpSecret"), body.Code) {
			return apis.NewBadRequestError("invalid code", nil)
		}
		user.Set("totpSecret", "")
		user.Set("totpEnabled", false)
		if err := e.App.Save(user); err != nil {
			return err
		}
		return e.JSON(http.StatusOK, map[string]bool{"enabled": false})
	}).Bind(apis.RequireAuth())

	// required: public; tells the client whether to prompt for a 2FA code.
	g.POST("/required", func(e *core.RequestEvent) error {
		var body struct{ Identity string `json:"identity"` }
		if err := e.BindBody(&body); err != nil {
			return err
		}
		required := false
		if u, err := findUserByIdentity(e.App, body.Identity); err == nil {
			required = u.GetBool("totpEnabled")
		}
		return e.JSON(http.StatusOK, map[string]bool{"required": required})
	})

	// login: public; password (+ TOTP if enabled) → standard auth response.
	g.POST("/login", func(e *core.RequestEvent) error {
		var body struct {
			Identity string `json:"identity"`
			Password string `json:"password"`
			Code     string `json:"code"`
		}
		if err := e.BindBody(&body); err != nil {
			return err
		}
		u, err := findUserByIdentity(e.App, body.Identity)
		if err != nil || !u.ValidatePassword(body.Password) {
			return apis.NewBadRequestError("invalid credentials", nil)
		}
		if u.GetBool("totpEnabled") && !totpValidate(u.GetString("totpSecret"), body.Code) {
			return apis.NewBadRequestError("invalid 2FA code", nil)
		}
		return apis.RecordAuthResponse(e, u, "password", nil)
	})

	_ = time.Now // keep import if unused after edits
}

func findUserByIdentity(app core.App, identity string) (*core.Record, error) {
	if u, err := app.FindAuthRecordByEmail("users", identity); err == nil {
		return u, nil
	}
	return app.FindFirstRecordByData("users", "username", identity)
}
```

> Symbol checks against the pinned version: `se.Router.Group`, `(*core.RequestEvent).BindBody`, `apis.RequireAuth()`, `apis.RecordAuthResponse`, `(*core.Record).ValidatePassword`, `e.Auth`. If any differ, fix per docs — Step 4 will tell you immediately.

- [ ] **Step 4: Run the helper test to verify it passes**

Run: `cd /home/pi/Projects/Docker/LoyaltyCards-Sync && go test ./... -run TestTotpGenerate -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /home/pi/Projects/Docker/LoyaltyCards-Sync
git add totp.go totp_test.go
git commit -m "LoyaltyCards-Sync: TOTP enroll/enable/disable/login routes + helpers"
```

---

## Task 5: TOTP HTTP flow integration test (TDD)

**Files:**
- Modify: `/home/pi/Projects/Docker/LoyaltyCards-Sync/totp_test.go`

- [ ] **Step 1: Write the failing integration test** (append to `totp_test.go`) — full enroll→enable→login over HTTP

```go
import (
	"encoding/json"
	"net/http"
	"strings"
	"testing"
	"time"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tests"
	"github.com/pquerna/otp/totp"
)

func TestTotpLoginRequiresValidCode(t *testing.T) {
	app, err := tests.NewTestApp()
	if err != nil {
		t.Fatal(err)
	}
	defer app.Cleanup()
	bindAppRoutes(t, app) // registers /api/loyalty/totp/* on the test app's router

	// create a user and enable TOTP directly via the model (skip the HTTP enroll for setup speed)
	col, _ := app.FindCollectionByNameOrId("users")
	u := core.NewRecord(col)
	u.SetEmail("totp@example.com")
	u.SetPassword("password123")
	u.Set("verified", true)
	secret, _, _ := totpEnroll("totp@example.com")
	u.Set("totpSecret", secret)
	u.Set("totpEnabled", true)
	if err := app.Save(u); err != nil {
		t.Fatal(err)
	}

	good, _ := totp.GenerateCode(secret, time.Now())

	// wrong code → 400
	bad := tests.ApiScenario{
		Name:           "login wrong 2FA",
		Method:         http.MethodPost,
		URL:            "/api/loyalty/totp/login",
		Body:           strings.NewReader(`{"identity":"totp@example.com","password":"password123","code":"000000"}`),
		ExpectedStatus: 400,
		TestAppFactory: func(t testing.TB) *tests.TestApp { return app },
	}
	bad.Test(t)

	// right code → 200 with a token
	ok := tests.ApiScenario{
		Name:            "login good 2FA",
		Method:          http.MethodPost,
		URL:             "/api/loyalty/totp/login",
		Body:            strings.NewReader(`{"identity":"totp@example.com","password":"password123","code":"` + good + `"}`),
		ExpectedStatus:  200,
		ExpectedContent: []string{"\"token\":"},
		TestAppFactory:  func(t testing.TB) *tests.TestApp { return app },
	}
	ok.Test(t)

	_ = json.Marshal // silence unused if trimmed
}
```

- [ ] **Step 2: Add the `bindAppRoutes` test helper** (in `totp_test.go`) so routes exist on the test app

```go
func bindAppRoutes(t *testing.T, app core.App) {
	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		registerTOTPRoutes(se)
		return se.Next()
	})
	if err := app.Bootstrap(); err != nil {
		t.Fatalf("bootstrap: %v", err)
	}
}
```

> If `tests.ApiScenario` already wires `OnServe` handlers when using `TestAppFactory`, `bindAppRoutes` may be redundant — confirm against the harness; the scenario must hit the registered group. Adjust so the route is reachable (the wrong-code 400 vs right-code 200 distinction is the real assertion).

- [ ] **Step 3: Run to verify it fails**

Run: `cd /home/pi/Projects/Docker/LoyaltyCards-Sync && go test ./... -run TestTotpLogin -v`
Expected: FAIL first (route not reached / harness wiring), then iterate on `bindAppRoutes` until the two assertions are exercised.

- [ ] **Step 4: Make it pass**

Iterate the harness wiring until: wrong code → 400, correct code → 200 containing `"token":`.
Run: `cd /home/pi/Projects/Docker/LoyaltyCards-Sync && go test ./... -run TestTotpLogin -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /home/pi/Projects/Docker/LoyaltyCards-Sync
git add totp_test.go
git commit -m "LoyaltyCards-Sync: HTTP integration test for TOTP login (wrong/right code)"
```

---

## Task 6: Full local run — schema + admin + smoke test

**Files:** none (verification task)

- [ ] **Step 1: Run the whole test suite**

Run: `cd /home/pi/Projects/Docker/LoyaltyCards-Sync && go test ./... -v`
Expected: all tests PASS.

- [ ] **Step 2: Build + boot the container fresh**

Run:
```bash
cd /home/pi/Projects/Docker/LoyaltyCards-Sync
docker compose down -v   # wipe any prior pb_data volume
docker compose build && docker compose up -d
sleep 5
docker compose logs --tail=30 loyalty-sync
```
Expected logs show migrations applied (`cards` created) and the server listening.

- [ ] **Step 3: Smoke-test the API end to end** (in-network, no host port needed)

Run:
```bash
NET=loyaltycards-sync_default
run() { docker run --rm --network "$NET" curlimages/curl:latest -s "$@"; }
# health
run -o /dev/null -w "health %{http_code}\n" loyalty-sync:8090/api/health
# create a user via the records API (open signup if enabled; else via admin) — adjust as configured
run -X POST loyalty-sync:8090/api/collections/users/records \
  -H 'Content-Type: application/json' \
  -d '{"email":"smoke@example.com","password":"password123","passwordConfirm":"password123"}' -o /dev/null -w "signup %{http_code}\n"
# 2FA required check
run -X POST loyalty-sync:8090/api/loyalty/totp/required \
  -H 'Content-Type: application/json' -d '{"identity":"smoke@example.com"}'
```
Expected: health 200; signup 200 (or 400 if open signup is disabled — then create via admin UI); `/totp/required` returns `{"required":false}`.

- [ ] **Step 4: Tear down**

Run: `cd /home/pi/Projects/Docker/LoyaltyCards-Sync && docker compose down`

- [ ] **Step 5: Write `README.md`** documenting bootstrap (admin from env, where data lives, how to enable Google OAuth later, the `/api/loyalty/totp/*` endpoints) and commit

```bash
cd /home/pi/Projects/Docker/LoyaltyCards-Sync
git add README.md
git commit -m "LoyaltyCards-Sync: document bootstrap, data volume, and TOTP/auth endpoints"
```

---

## Task 7: Harden API config for the PWA (CORS / signup / token longevity)

**Files:**
- Modify: `/home/pi/Projects/Docker/LoyaltyCards-Sync/main.go`

- [ ] **Step 1: Set auth-token longevity for a non-expiring-feel session**

In `main.go`, inside the `OnServe` bind (before `registerTOTPRoutes`), raise the `users` collection auth-token duration so the persisted client session effectively never forces re-login (refresh extends it). Add:

```go
	if uc, err := app.FindCollectionByNameOrId("users"); err == nil {
		// ~10 years; client auto-refreshes, so a logged-in user stays logged in until they log out.
		uc.AuthToken.Duration = 315360000
		_ = app.Save(uc)
	}
```

- [ ] **Step 2: Confirm CORS allows the PWA origin**

Pocketbase enables permissive CORS by default; the PWA calls with bearer tokens (not cookies), so the default is fine for `https://loyalty-cards.holy-grail.ch`. No code change unless a stricter `--origins` flag is later desired. Document this decision in `README.md`.

- [ ] **Step 3: Rebuild + re-run the suite and a boot smoke test**

Run:
```bash
cd /home/pi/Projects/Docker/LoyaltyCards-Sync
go build ./... && go test ./... >/dev/null && echo TESTS_OK
docker compose build && docker compose up -d && sleep 5
docker run --rm --network loyaltycards-sync_default curlimages/curl:latest -s -o /dev/null -w "health %{http_code}\n" loyalty-sync:8090/api/health
docker compose down
```
Expected: `TESTS_OK` and health 200.

- [ ] **Step 4: Commit**

```bash
cd /home/pi/Projects/Docker/LoyaltyCards-Sync
git add main.go README.md
git commit -m "LoyaltyCards-Sync: long-lived auth token + document CORS posture"
```

---

## Task 8: Deploy wiring (USER-GATED — prepare, do not apply to live infra)

**Files:**
- Create: `/home/pi/Projects/Docker/LoyaltyCards-Sync/deploy/loyalty-sync.yml` (Traefik dynamic config, to be copied to `Traefik/traefik/dynamic/` by the user)

- [ ] **Step 1: Write the Traefik dynamic config** mirroring the existing `loyalty-cards.yml` pattern

```yaml
http:
  routers:
    loyalty-sync:
      rule: "Host(`loyalty-sync.holy-grail.ch`)"
      entryPoints: ["websecure"]
      priority: 1
      service: loyalty-sync
      middlewares:
        - default-rate-limit@file
        - loyalty-sync-secure-headers
      tls:
        certResolver: cloudflare

  middlewares:
    loyalty-sync-secure-headers:
      headers:
        stsSeconds: 31536000
        stsIncludeSubdomains: true
        stsPreload: true
        contentTypeNosniff: true
        referrerPolicy: "strict-origin-when-cross-origin"
        frameDeny: true
        customResponseHeaders:
          Server: ""

  services:
    loyalty-sync:
      loadBalancer:
        servers:
          - url: "http://loyalty-sync:8090"
        passHostHeader: true
```

- [ ] **Step 2: Prepare the PWA CSP change** (do not apply yet) — `connect-src` must allow the sync origin.

The edit for `Traefik/traefik/dynamic/loyalty-cards.yml` (user applies on their cadence):
```
connect-src 'self' https://img.logo.dev https://icon.horse https://icons.duckduckgo.com https://loyalty-sync.holy-grail.ch;
```

- [ ] **Step 3: Write the deploy checklist into `README.md`** and commit (config only; nothing applied)

The checklist for the user:
1. Add Cloudflare Tunnel public hostname `loyalty-sync.holy-grail.ch` → `http://traefik` (same pattern as `loyalty-cards`).
2. Copy `deploy/loyalty-sync.yml` → `Traefik/traefik/dynamic/loyalty-sync.yml`.
3. Apply the `connect-src` CSP edit to `loyalty-cards.yml`.
4. `cd /home/pi/Projects/Docker/LoyaltyCards-Sync && docker compose up -d --build`.
5. Verify `https://loyalty-sync.holy-grail.ch/api/health` → 200.
6. Log into the admin UI once to confirm the schema, set the Google OAuth2 provider (optional), and verify open-signup is configured as desired.

```bash
cd /home/pi/Projects/Docker/LoyaltyCards-Sync
git add deploy/loyalty-sync.yml README.md
git commit -m "LoyaltyCards-Sync: Traefik route + deploy checklist (prepared, not applied)"
```

- [ ] **Step 4: STOP and hand off to the user**

Report that the backend builds, tests green, and runs locally; present the Task-8 checklist and ask the user to perform (or authorise) the live deploy. Do not push the homelab infra repo or apply live changes without explicit confirmation.

---

## Self-Review

**Spec coverage (§ → task):**
- §3.1 cards collection + users fields + owner rules → Task 3 ✓
- §3.2 TOTP routes (setup/enable/disable/required/login) → Tasks 4–5 ✓
- §4 infra (Docker project per sample, Traefik, Cloudflare, CSP) → Tasks 1, 2, 8 ✓
- §5 security (owner isolation tested, hidden secrets, bcrypt via PB, rate-limit middleware, admin gated) → Tasks 3, 4, 8 ✓
- §6 testing (owner isolation, TOTP happy/wrong-code) → Tasks 3, 5 ✓
- §2 persistent session (long token) → Task 7 ✓
- Photo sync / sharing / OAuth provider config UI → correctly OUT of Phase A (later phases / admin UI) ✓
- *Gap noted:* enabling Google OAuth2 is configured via the admin UI + env, not codified as a migration here — acceptable for Phase A (the password+TOTP path is fully covered); revisit if we want it reproducible in code.

**Placeholder scan:** No "TBD/TODO". Version-sensitivity is called out explicitly with a verification instruction and the tests as the safety net (not a placeholder — a known property of building against Pocketbase's Go API).

**Type/name consistency:** `cards` field names match between the migration (Task 3) and the smoke/sync references; `totpEnroll`/`totpValidate`/`registerTOTPRoutes`/`findUserByIdentity` are defined once (Task 4) and reused consistently in tests (Tasks 4–5); the owner rule string is identical in the migration and the rules test.

---

## Phases B & C (separate plans, after A deploys)

- **Phase B — Frontend auth + account UI:** auth store wrapping the PB SDK, Settings account section, Google + password(+TOTP) login, persistent `localStorage` session, Home backup banner.
- **Phase C — Sync engine:** `syncQueue` IndexedDB store, push/pull/merge (last-write-wins + tombstones), realtime subscription, offline flush, first-login adoption, Playwright two-context e2e.

Each will be planned with the same TDD granularity once Phase A is live.
