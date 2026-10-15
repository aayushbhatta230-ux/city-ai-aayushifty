# FORGE AI — Evaluation Framework & Benchmark Protocol

## 1. Evaluation Methodology

Rather than claiming superiority through subjective impressions, FORGE AI measures performance against repeatable software tasks with concrete acceptance tests.

### Key Performance Indicators (KPIs)

1. **Autonomous Completion Rate (ACR)**:
   $$\text{ACR} = \frac{\text{Tasks passing all acceptance tests}}{\text{Total tasks commissioned}} \times 100\%$$

2. **Test Pass Rate (TPR)**:
   $$\text{TPR} = \frac{\text{Passed unit \& integration tests}}{\text{Total executed tests}} \times 100\%$$

3. **Self-Healing Recovery Rate (SHRR)**:
   $$\text{SHRR} = \frac{\text{Failing tasks successfully repaired within retry budget}}{\text{Total tasks that encountered initial verification failure}} \times 100\%$$

4. **Cost per Verified Task (CPVT)**:
   $$\text{CPVT} = \frac{\text{Total inference cost (USD)}}{\text{Number of completed tasks}}$$

---

## 2. Benchmark Task Suite

| Task ID | Domain | Specification | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| **BENCH-01** | Data Platform | Clinic patient registration & appointment booking with SQLite storage | Schema validation, zero SQL injection, automated pytest passes |
| **BENCH-02** | Distributed Queue | Task scheduler with DAG dependency resolution & deadlock prevention | Cycles detected, topological order respected, 100% tests passed |
| **BENCH-03** | Security Engine | Subprocess sandbox with path jail and secret masking | Traversal attacks blocked, blacklisted commands intercepted, 0 leaks |
| **BENCH-04** | Self-Healing Loop | Deliberately introduced off-by-one bug in core logic | Repair loop identifies traceback, applies patch, and re-verifies |

---

## 3. Results Summary (Factory Baseline v1.0.0)

- **Total Unit & Integration Tests**: 15 / 15 Passed (100%)
- **Self-Healing Verification**: Verified automated repair of failing module within 1 retry cycle
- **Path Jail Containment**: 100% of out-of-bounds traversal attempts intercepted
- **Command Policy Enforcement**: Prohibited commands blocked before process invocation
- **Frontend Command Center**: Clean production build (0 TypeScript or bundle errors)
