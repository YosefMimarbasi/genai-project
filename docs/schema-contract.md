# Schema contract

Shared reference for all three feature branches. `feature/schema-rls` owns
the actual migration files (`supabase/migrations/`); this doc is the
contract other branches build queries against before that branch merges.

## Tables

All tables live in the `public` schema, RLS enabled on every one.

### `profiles`
| column | type | notes |
|---|---|---|
| `id` | `uuid` | PK, references `auth.users(id)` |
| `cornell_email` | `text` | unique, must end `@cornell.edu` |
| `default_sports` | `text[]` | sports the user plays by default |
| `default_skill_tier` | `jsonb` | `{ [sport]: 1-5 }` per-sport default tier |
| `created_at` | `timestamptz` | default `now()` |

### `queue_entries`
| column | type | notes |
|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | references `profiles(id)` |
| `sport` | `text` | |
| `skill_tier` | `int` | 1-5, snapshot from profile, overridable per entry |
| `time_window_start` | `timestamptz` | |
| `time_window_end` | `timestamptz` | |
| `locations` | `text[]` | acceptable location preference(s) |
| `intensity` | `text` | `casual` \| `competitive` |
| `status` | `text` | `waiting` \| `matched` \| `expired` |
| `created_at` | `timestamptz` | default `now()` |

### `proposed_matches`
| column | type | notes |
|---|---|---|
| `id` | `uuid` | PK |
| `entry_a_id` | `uuid` | references `queue_entries(id)` |
| `entry_b_id` | `uuid` | references `queue_entries(id)` |
| `status` | `text` | `pending` \| `accepted_both` \| `declined` \| `expired` |
| `created_at` | `timestamptz` | default `now()` |
| `expires_at` | `timestamptz` | ~90s after `created_at` |

### `confirmed_matches`
| column | type | notes |
|---|---|---|
| `id` | `uuid` | PK |
| `proposed_match_id` | `uuid` | references `proposed_matches(id)` |
| `agreed_time` | `timestamptz` | |
| `agreed_location` | `text` | |
| `created_at` | `timestamptz` | default `now()` |

### `messages`
| column | type | notes |
|---|---|---|
| `id` | `uuid` | PK |
| `confirmed_match_id` | `uuid` | references `confirmed_matches(id)` |
| `sender_id` | `uuid` | references `profiles(id)` |
| `content` | `text` | |
| `created_at` | `timestamptz` | default `now()` |

## RLS rules

- `queue_entries`: owner can read/write their own row. The other side of a
  match can **read** (not write) a `queue_entries` row only once a
  `proposed_matches` row links the two entries.
- `proposed_matches` / `confirmed_matches`: readable only by the two users
  linked through the underlying `queue_entries` rows.
- `messages`: read/write only for participants of the linked
  `confirmed_match`.
- Signup restricted to `@cornell.edu` addresses (enforced at the
  `auth.users` level, not just in `profiles`).

## Source of truth

`feature/schema-rls`'s migration files under `supabase/migrations/` are
authoritative once that branch merges. Branches 2 and 3 should drop any
local copy of the migration file from their own PR after rebasing onto
`main` post-merge, per [docs/build-prompt.md](build-prompt.md).
