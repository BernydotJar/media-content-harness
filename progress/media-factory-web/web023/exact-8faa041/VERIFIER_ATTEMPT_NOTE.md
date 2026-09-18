# Superseded verifier attempt note

An earlier fresh-archive verifier attempt was invalidated by overlapping tool execution against the same temporary extraction directory. The overlap removed tracked example files while the first process was still reading them, producing an `ENOENT` unrelated to product source. That attempt is preserved as `superseded-independent-verifier-attempt.log` and is not used as release authority.

The verifier was then rerun once, serially, in a new fresh archive path; `independent-verifier.log` is the authoritative result and ends `verifier_verdict=PASS`.
