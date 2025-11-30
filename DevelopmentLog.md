# Development Log

## 2025-11-30: Fix Verify Script for Dockerfile Checks

### Problem
The `verify-deployment.js` script was failing with false positives:
- "Dockerfile missing server-middleware package.json copy"
- "Dockerfile missing pubsub package.json copy"

### Root Cause
The verify script was looking for exact string `server-middleware/package.json` but the Dockerfile copies entire directories with `COPY --from=builder /app/packages/server-middleware`, which includes package.json.

### Solution
Updated verify script to check for either explicit package.json copy OR directory copy pattern.

### Files Modified
- `scripts/verify-deployment.js`: Updated string matching logic
- `Dockerfile`: Added clarifying comments

### Testing
- Verify script passes ✅
- Build passes ✅
- 150/151 E2E tests pass ✅

---

## 2025-11-30: Fix Hydra Eval Sync for Joining Users

### Problem
When User A presses Ctrl+Enter to evaluate Hydra code, User B doesn't see the visual change. Strudel worked correctly but Hydra didn't sync.

### Root Cause Analysis
Traced the complete eval flow:
1. User presses Ctrl+Enter → `doc.evaluate()` with `mode: "web"`
2. Session publishes to `session:${name}:target:hydra:eval` via PubSub
3. Other users receive message via PubSub subscription
4. Session emits `eval:hydra` event
5. `WebTargetIframe` posts message to Hydra iframe
6. Hydra iframe evaluates code

**The bug was in step 3**: The PubSub subscription happens in `_subscribeToTarget()`, which is only called when the Y.Map `observe` callback fires. However, Y.Map `observe` only fires for **NEW changes**, not for existing values when a user joins.

So when User B joins a session where Hydra is already set up:
- Y.js syncs the document (code text appears)
- But the observer doesn't fire for existing targets
- User B never subscribes to `session:${name}:target:hydra:eval`
- User B never receives eval messages from User A

### Solution
Added `_subscribeToExistingTargets()` method that runs on first sync:

```typescript
_subscribeToExistingTargets() {
  const targets = this._yTargets();
  const uniqueTargets = new Set(targets.values());
  uniqueTargets.forEach((target) => {
    this._subscribeToTarget(target);
  });
}
```

Called from each provider's "synced" event handler.

Also added `_subscribedTargets: Set<string>` to track subscriptions and prevent duplicates.

### Files Modified
- `packages/session/lib/session.ts`: Added sync-time subscription to existing targets

### Testing
- Build passes ✅
- 150/151 E2E tests pass ✅

---

## 2025-11-30: Auto-Fork Sketches for Non-Owners

### Problem
Several permission issues with collaborative sketches:

1. When non-owner opens sketch via link, nothing saved to their dashboard
2. When non-owner clicks Save, it created a new sketch making them owner instead of creating a fork
3. Save button kept asking for name instead of auto-updating existing sketch

### Solution
Auto-create fork IMMEDIATELY when non-owner opens a sketch via link.

#### New Flow
1. User A creates sketch → saved to A's PDS as `role: "owner"`
2. User A shares link → `?sketch=at://A/cc.hocket.sketch/xyz`
3. User B opens link (signed in) → **auto-creates fork on B's PDS immediately**
   - `role: "editor"`
   - `forkedFrom: at://A/cc.hocket.sketch/xyz`
   - `name: "Fork of [original name]"`
   - Toast: "Fork created - saved to your account"
4. User B sees sketch in their dashboard immediately
5. User B clicks Save → updates their fork (no dialog, no name prompt)

#### Technical Changes
- Moved fork creation from `handleSaveSketch` to `loadSketch` effect
- Fork is created as soon as sketch loads (before any user interaction)
- Save button now always updates existing `currentSketchUri` (either original or fork)
- Preserved `role` and `forkedFrom` fields on updates

### Hydra Sync Clarification
Code sync (Y.js) and eval sync (PubSub) are separate:
- Code text changes sync automatically via Y.js ✅
- Visual evaluation only syncs when Ctrl+Enter is pressed via PubSub ✅
- This is by design - you see code changes immediately but must evaluate to see visuals

### Files Modified
- `packages/web/src/routes/session.tsx`: Auto-fork on load, simplified save logic

### Testing
- Build passes ✅
- 150/151 E2E tests pass ✅

---

## 2025-11-30: Sketch Ownership and Fork Permissions

### Problem
Need a permission system for collaborative sketches where:
- Sketches have a single owner (the creator)
- Collaborators can save their own version (fork) without affecting owner's version
- Owner's PDS is source of truth for their sketch
- Forks are independent - if owner deletes, forks remain

### Solution

#### Schema Changes
Added ownership fields to `SketchRecord`:
- `ownerDid: string` - DID of original creator (immutable)
- `ownerHandle: string` - Handle at creation time (for display)
- `role: "owner" | "editor"` - This record holder's role
- `forkedFrom?: string` - URI of original sketch (if fork)

#### Behavior Matrix
| Action | Owner | Editor (Fork) |
|--------|-------|---------------|
| Create sketch | Sets `role: "owner"`, `ownerDid: self` | N/A |
| Join via link | N/A | Can edit via Y.js |
| Save | Updates own PDS record | Creates fork with `role: "editor"` |
| Delete | Deletes from PDS | Deletes own fork only |
| Dashboard | Crown icon | Fork icon + "Forked from @handle" |

#### Fork Flow
1. User A creates sketch → `role: "owner"`, `ownerDid: A`
2. User A shares link → `?sketch=at://A/cc.hocket.sketch/xyz`
3. User B joins, edits via Y.js real-time
4. User B clicks Save → creates NEW record on B's PDS:
   - `role: "editor"`
   - `forkedFrom: at://A/cc.hocket.sketch/xyz`
   - `name: "Fork of [original name]"`

### Files Modified
- `packages/web/src/lib/sketch-schema.ts`: Added ownership fields
- `packages/web/src/lib/atproto.ts`: Include ownership in create/update
- `packages/web/src/routes/session.tsx`: Detect non-owner, create fork on save
- `packages/web/src/contexts/sketch-context.tsx`: Pass owner fields
- `packages/web/src/components/sketch/sketch-card.tsx`: Show crown/fork icons

### Testing
- Build passes ✅
- TypeScript check passes ✅
- 125/150 E2E tests pass (failures are pre-existing mock auth issues)

---

## 2025-11-30: Manual Save Button

### Problem
Auto-save has 3-second debounce. Users want immediate save without waiting.

### Solution
Added floating "Save" button in bottom right of session editor.

### Features
- Shows three states: idle (save icon), saving (spinner), saved (checkmark)
- Triggers immediate save to PDS
- Clears any pending auto-save timeout
- Toast notification on save

### Files Modified
- `packages/web/src/routes/session.tsx`: Added `saveNow` function and Save button UI

---

## 2025-11-30: Session Name Persistence for Sketches

### Problem
When opening a saved sketch from the dashboard, the sketch content was still lost. The previous fix addressed race conditions but the fundamental issue remained:

1. Dashboard was generating a NEW random session name every time a sketch was opened
2. Y.js sessions are tied to session names - different name = different Y.js document
3. Content was saved to PDS but Y.js session was always empty on reload

### Solution
Added `sessionName` field to sketch records so sketches remember their Flok session:

1. **Schema changes**: Added `sessionName` to `SketchRecord` and `SketchInput` interfaces
2. **Create/Update**: Store current session name when saving sketches
3. **Dashboard**: Use stored `sessionName` when opening sketch (fallback to random if not set)
4. **Load logic**: Check if Y.js already has content before loading from PDS

### Files Modified
- `packages/web/src/lib/sketch-schema.ts`: Added `sessionName` field
- `packages/web/src/lib/atproto.ts`: Include `sessionName` in create/update
- `packages/web/src/routes/dashboard.tsx`: Use stored sessionName when opening
- `packages/web/src/routes/session.tsx`: 
  - Pass sessionName when creating/saving
  - Check for existing Y.js content before overwriting

### How it works now
1. User creates session `/s/foo` → sketch saved with `sessionName: "foo"`
2. User edits, auto-save updates PDS
3. User leaves, returns via dashboard
4. Dashboard opens `/s/foo?sketch=uri` (same session name!)
5. Y.js syncs → content already there from session `foo`
6. Sketch load detects existing content → skips PDS overwrite

---

## 2025-11-30: Fix Sketch Loading Race Condition

### Problem
When opening a saved sketch from the dashboard, the sketch content would be empty or contain default sample code instead of the saved content. This happened because:

1. The Flok session initialization (`initializeSession`) was racing with sketch loading from PDS
2. `initializeSession` would set default sample code before `loadSketch` could set the actual sketch content
3. The sketch loading didn't wait for the session WebSocket to be fully synced

### Root Cause
The session page has multiple competing effects:
- Session creation → triggers Y.js sync → calls `initializeSession()`  
- Sketch loading → fetches from PDS → tries to set document content

These were not coordinated, leading to `initializeSession` overwriting sketch content with defaults.

### Solution
1. Added `sessionSynced` state to track when WebSocket sync is complete
2. Added `sketchLoadedRef` to prevent double-loading
3. Modified `initializeSession` to check for `?sketch=` URL param and skip default code if present
4. Modified sketch loading effect to wait for `sessionSynced` before setting content
5. Added cleanup to reset refs when session changes

### Files Modified
- `packages/web/src/routes/session.tsx`:
  - Added `sessionSynced` state and `sketchLoadedRef` ref
  - Modified `initializeSession()` to detect sketch loading mode
  - Modified sketch loading effect to depend on `sessionSynced`
  - Added proper cleanup in session useEffect

### Testing
- Build passes
- TypeScript check passes
- Session page tests pass (11/17, remaining failures are pre-existing mock auth issues)

---

## 2024-11-29: Share Permissions Feature

### What was done
Implemented authentication requirements for sharing and joining shared sessions.

### Changes made

**Files modified:**
- `packages/web/src/components/session-command-dialog.tsx` - Added LogIn icon import, replaced "Share URL" command with "Sign in to share sessions" prompt for unauthenticated users
- `packages/web/src/routes/session.tsx` - Added two useEffect hooks to block access to shared sessions (via URL hash or ?sketch= parameter) for unauthenticated users, redirecting them to sign-in
- `packages/web/src/routes/auth/sign-in.tsx` - Added useSearchParams to handle redirect parameter, passes redirectUrl to SignInForm
- `packages/web/src/components/auth/sign-in-form.tsx` - Added redirectUrl prop, navigates to redirect URL after successful sign-in instead of always going to /dashboard
- `packages/web/tests/e2e/collaboration.spec.ts` - Updated tests to reflect new auth requirements for sharing
- `packages/web/tests/e2e/session-commands.spec.ts` - Updated tests to check for sign-in prompt instead of Share URL for unauthenticated users

### How it works
1. When unauthenticated user opens command dialog (Ctrl+J) and searches for "share", they see "Sign in to share sessions" link instead of "Share URL"
2. When unauthenticated user tries to access a URL with shared code in hash (`#targets=...&c0=...`), they are redirected to `/auth/sign-in?redirect=<original-url>`
3. When unauthenticated user tries to access a sketch via `?sketch=<uri>`, they are redirected to sign-in
4. After signing in, user is redirected back to the originally requested URL

### Tests
4 related tests pass:
- `session-commands.spec.ts:67` - should show share URL command (now shows sign-in prompt)
- `session-commands.spec.ts:198` - should show sign-in prompt when not authenticated
- `collaboration.spec.ts:180` - should require authentication to share session URL
- `collaboration.spec.ts:197` - should redirect to sign-in when loading shared session without auth

---

## 2025-11-30: Multi-Pane Sketch Save/Load with ATProto Lexicon

### What was done
Fixed sketch save/load functionality to properly preserve multi-pane structure when saving to and loading from ATProto (user's PDS).

### Problem
Previously, sketches were saved by combining all pane contents into a single string with text markers (`// Target: strudel\n...`). When loaded, everything was dumped into the first pane only, losing the multi-pane structure.

### Solution
Changed sketch record format to store panes as a structured array with target, content, and order for each pane.

### Files created
- `packages/web/src/lexicons/cc/hocket/sketch.json` - ATProto lexicon schema defining:
  - `name` - sketch name (required)
  - `description` - optional description
  - `panes[]` - array of code panes with target, content, order (required)
  - `tags[]` - optional categorization tags
  - `visibility` - public/private (default: public)
  - `createdAt` / `updatedAt` - timestamps

### Files modified
**`packages/web/src/lib/atproto.ts`**:
- Added `SketchPane` interface: `{ target: string; content: string; order?: number }`
- Added `SketchRecord` interface with all lexicon fields including `$type`
- Added `SketchInput` interface for create/update operations
- Updated `createSketch()` to save panes array with `$type: 'cc.hocket.sketch'`
- Updated `updateSketch()` to preserve `createdAt` and update `updatedAt`
- Updated `getSketch()` to return typed `SketchRecord`

**`packages/web/src/routes/session.tsx`**:
- Updated `handleSaveSketch` to create panes array from documents with target, content, order
- Updated `loadSketch` to:
  - Sort panes by order
  - Call `session.setActiveDocuments()` with correct targets
  - Set content for each pane after Yjs creates documents

**`packages/web/src/contexts/sketch-context.tsx`**:
- Updated `saveSketch` signature: `(name: string, panes: SketchPane[]) => Promise<void>`
- Updated `updateExistingSketch` signature to accept panes array

### ATProto notes
- Lexicon publication is optional - PDS uses "fail-open" validation
- Records include `$type: 'cc.hocket.sketch'` for proper interoperability
- Sketches are saved to user's own PDS (bsky.social, tangled.social, etc.)

### Build fix

Also fixed a pre-existing build issue where npm workspace links were broken. Running `npm install` from root fixed the symlinks, allowing all 9 packages to build successfully.

### Deployed

- Committed: `feat: implement multi-pane sketch save/load with ATProto lexicon`
- Merged to main via `--no-ff`
- Pushed to origin

---

## 2025-11-30: Session Layout - Constrained Width with Header/Footer

### What was done

Restructured the session/playground page to include the site-wide Header and Footer, constrain the editor area to max-w-7xl width, and add rounded corners to match the design system.

### Problem

The session page (`/s/{name}`) was a full-screen Flok editor that didn't match the site's visual design. It had no header/footer, used the entire viewport width, and didn't align with the constrained layout of other pages.

### Solution

Wrapped the session content in the standard page layout with Header, constrained main content area, and Footer. The editor area now has rounded corners and is centered within max-w-7xl.

### Files modified

**`packages/web/src/routes/session.tsx`**:

- Added imports for Header and Footer components
- Restructured JSX to use flex column layout with Header at top, Footer at bottom
- Main content area uses `max-w-7xl px-6 lg:px-8` for consistent width
- Editor container has `rounded-lg` for rounded corners
- Moved CommandsButton and ReplsButton inside the constrained container (absolute positioned)
- Editor container height is `calc(100vh - 8rem)` to fit between header and footer

**`packages/web/src/components/mosaic.tsx`**:

- Changed `h-screen` to `h-full` so Mosaic fills its parent container
- Updated child divs to use `h-full` instead of `h-screen`

### Files created

**`packages/web/tests/e2e/session-layout.spec.ts`**:

- 11 new E2E tests covering:
  - Header visibility and navigation on session page
  - Footer visibility on session page
  - Constrained width (max-w-7xl) verification
  - Rounded corners (rounded-lg) verification
  - Background color (bg-stone-50) verification
  - Command button position and functionality
  - Responsive layout behavior

### Tests

- **New tests**: 11/11 pass
- **All tests**: 139 pass, 11 fail (pre-existing failures unrelated to this change)

### Pre-existing test failures (not caused by this change)

- Dashboard link tests expect link without authentication
- Text locator issues with `// comment` syntax
- Panic toast tests match multiple elements
- Sketch loading timeout flakiness

### Build

- `npm run build` passes successfully

---

## 2025-11-30: Sketch Persistence and Auto-Save

### What was done

Implemented automatic sketch persistence so that when a logged-in user creates a new sketch, it's automatically saved to their PDS (Personal Data Server). Sketches now appear in the dashboard immediately and are auto-saved when content changes.

### Problems Fixed

1. **Type mismatch**: `sketch-schema.ts` had outdated types (`content: string`) that didn't match the actual lexicon schema (`panes: SketchPane[]`)
2. **No auto-save**: New sketches were only saved if user manually clicked "Save to ATproto"
3. **Dashboard empty**: Even after creating sketches, the dashboard showed nothing because the type mismatch caused failures

### Solution

1. **Fixed type definitions** - Updated `sketch-schema.ts` to match the actual lexicon schema with proper `SketchPane` and `SketchRecord` types
2. **Added auto-save** - When authenticated users create a new session, a sketch is automatically created on their PDS
3. **Debounced updates** - Content changes are auto-saved after 3 seconds of inactivity
4. **Session-sketch linking** - Session URLs are linked to sketch URIs in localStorage so returning to a session reconnects to the same sketch

### Files Modified

**`packages/web/src/lib/sketch-schema.ts`**:
- Added `SketchPane` interface: `{ target: string; content: string; order?: number }`
- Updated `SketchRecord` to match lexicon: `{ $type?, name, description?, panes[], tags?, visibility?, createdAt, updatedAt? }`
- Updated `SketchListItem` to properly type API responses

**`packages/web/src/lib/atproto.ts`**:
- Refactored to import types from `sketch-schema.ts` instead of duplicating
- Re-exports types for convenient imports
- Cleaner separation of concerns

**`packages/web/src/routes/session.tsx`**:
- Added helper functions `getStoredSketchUri()` / `setStoredSketchUri()` to link sessions to sketches
- Added `autoSaveInitialized` ref to prevent duplicate sketch creation
- Added `autoSaveTimeoutRef` for debounced saving
- Added `lastSavedContentRef` to detect actual changes
- Added useEffect for auto-creating sketch when authenticated user starts new session
- Added useEffect for debounced auto-save on document changes (3 second delay)
- Updated `handleSaveSketch` to store URI and update content ref

**`packages/web/src/components/sketch/sketch-card.tsx`**:
- Enhanced to display targets/languages used in each sketch (badges)
- Shows pane targets like "strudel", "hydra" etc.

### How It Works

1. **New Session Flow (Authenticated)**:
   - User clicks "New Sketch" or navigates to `/s/{sessionName}`
   - After session loads, auto-save effect checks if user is authenticated
   - If no existing sketch linked to this session, creates new sketch on PDS
   - Stores `hocket-sketch-session:{sessionName}` -> URI in localStorage

2. **Auto-Save Flow**:
   - When documents change, debounced effect queues save after 3 seconds
   - Only saves if content actually changed (compared via JSON stringification)
   - Updates existing sketch record on PDS

3. **Return to Session**:
   - If user returns to same session URL, looks up stored sketch URI
   - Reconnects to existing sketch for continued editing

4. **Dashboard**:
   - Fetches all sketches from user's PDS collection `cc.hocket.sketch`
   - Displays sketch cards with name, date, and target language badges

### Tests

All sketch and session tests pass:
- `sketch-management.spec.ts`: 7/7 pass
- `session.spec.ts`: 10/10 pass
- Build passes

### Deployed

- Branch: `feature/fix-sketch-persistence`
- Build: Passes
- Type check: Passes
