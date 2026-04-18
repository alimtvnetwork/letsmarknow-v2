# Large Imports

Handling 50k+ items without blowing up memory, exceeding timeouts, or producing partial state.

---

## 1. Definition

- "Large" = > 5,000 items OR > 5 MB file.
- Triggers chunked / streaming / resumable code paths automatically.
- User sees a clear "Large import — processed in background" indicator.

## 2. Chunking strategy

### Upload
- Tus protocol for files > 5 MB.
- 5 MB chunks; resume after network interruption.
- Server reassembles in temp storage.

### Parse
- Streaming parser (no `JSON.parse` on whole file).
- For HTML: SAX-style streaming with state machine.
- For LMN JSON: streaming JSON parser (`@streamparser/json`-style).
- For CSV: line-by-line.
- Records emitted as async iterator; never held in memory in bulk.

### Preview
- Preview computed during parse (single pass).
- Top 100 items per Collection cached.
- Full structure tree kept (collections + groups + counts only — no item bodies).
- Stored as Parquet for compact preview rendering.

### Commit
- Records replayed from Parquet preview cache.
- Batched into 500-item transactions.
- Each batch in its own DB transaction; failures isolated.
- Inter-batch checkpoint stored: `{ next_offset, completed_count }`.

## 3. Resumability

- Job state machine with checkpoints:
  - `uploaded` → `parsed` → `preview_ready` → `committing(offset=N)` → `committed`
- On crash mid-commit:
  - Job picked up by next worker.
  - State loaded; resumes from `offset=N`.
  - Already-committed batches NOT redone (idempotent insert via batch_id + record_id).

## 4. Memory budget

- Worker: max 512 MB heap.
- Streaming guarantees < 100 MB at peak even for 1M-item file.
- DB connection pool: 5 per worker.

## 5. Timing budgets

| Items | Parse | Preview | Commit | End-to-end |
|---|---|---|---|---|
| 10k | 5 s | 1 s | 30 s | < 1 min |
| 50k | 30 s | 5 s | 2 min | < 5 min |
| 100k | 60 s | 10 s | 5 min | < 10 min |
| 500k | 5 min | 30 s | 25 min | < 45 min |

## 6. User communication

### Progress UI
- `/imports/:id` page with live progress bar.
- WebSocket push for stage transitions.
- ETA estimate based on current throughput.
- "Email me when done" toggle (default on for > 50k items).

### Notifications
- In-app inbox + email when job completes / fails.
- Push notification (PWA / extension) for jobs > 5 min.

## 7. Cancellation

- Cancel button visible throughout.
- Pre-commit: temp files deleted; no DB writes.
- Mid-commit: stops at next batch boundary; committed work persists; user sees "Cancelled at 23,456 of 50,000 items — those are kept".

## 8. Background priority

- Large imports run on dedicated worker pool.
- Lower priority than user-facing requests (separate queue).
- Concurrent: max 3 large imports per Account; 50 platform-wide (Team workers scale).

## 9. Failure modes

| Failure | Handling |
|---|---|
| Worker crash | Auto-restart; resume from checkpoint |
| DB transient error | Retry batch up to 3x with backoff |
| DB persistent error | Halt; alert; user notified; resume after fix |
| Disk full (temp storage) | Halt with clear error; suggest splitting file |
| User-initiated cancel | Graceful stop |
| Quota exceeded mid-import | Halt; partial-commit summary; upgrade CTA |

## 10. Telemetry

- `large_import.queued` `{ size_bytes, estimated_items }`
- `large_import.started`
- `large_import.checkpoint` `{ offset, throughput_per_sec }` (every 60 s)
- `large_import.completed` `{ duration_ms, items, errors }`
- `large_import.failed` `{ reason, last_offset }`
- `large_import.cancelled` `{ stage, last_offset }`
- `large_import.resumed_from_crash` `{ offset }`

## 11. Backpressure

- If global commit queue depth > 100 jobs: new large imports queued (not rejected).
- User sees "Position N in queue · ~M minutes wait".
- Free tier deprioritized when queue is busy.

## 12. Edge cases

| Case | Behavior |
|---|---|
| User uploads same large file twice | Server detects duplicate by file hash (within 24h); offers "Resume previous" |
| Browser tab closed during upload | Tus resume picks up on next visit |
| Worker upgraded mid-job | Job migrated; resumes on new worker |
| Org deleted mid-job | Job aborted; cleanup runs; user notified |
| Plan downgrade mid-job (cap reduced below incoming size) | Halts at cap; remainder reported as "Upgrade to import more" |

## 13. Tests

- 100k-item synthetic in CI; full pipeline end-to-end.
- Crash injection at every checkpoint.
- Memory profile under load (assert < 100 MB peak).
- Concurrent imports without interference.
- Tus resumability across simulated network failure.
