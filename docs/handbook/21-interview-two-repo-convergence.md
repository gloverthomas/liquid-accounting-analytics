> 📌 **Manual sync:** GitHub handbook + Linear in the same change ([documentation-sync.md](./documentation-sync.md)).

# Interview prep: Two-repo convergence story

**Problem space:** Legacy / split-app modernization (assignment Example A).

---

## Product vs engineering reality

| Customer sees | Engineering owns |
| --- | --- |
| One Liquid brand | **Core** + **Reporting** deployables |
| Same nav, assistant, help patterns | Duplicated shell; Reporting drifts |
| Single sign-on narrative (demo) | Separate Vercel projects + BFFs |

**Migration seam ADRs:** [Core 0004](https://linear.app/liquid-accounting/document/decision-core-0004-reporting-stays-a-separate-app-until-the-planned-5c528182ac8d), [Reporting 0004](https://linear.app/liquid-accounting/document/decision-reporting-0004-reporting-stays-a-separate-app-until-the-a8ca85155c0a).

---

## SDK loop (per hero LIQ)

1. **Classify** shared shell vs report-only ([LIQ-12](https://linear.app/liquid-accounting) planner narrative).
2. **Plan** with feature-map paths ([07 · Feature map](https://linear.app/liquid-accounting/document/07-cursor-sdk-and-cloud-agents-reference-d455f9df1888)).
3. **Specialists** PASS/FAIL on seam.
4. **Eval** enforces bounded language.
5. **Implement** atomic PR pair (Core and/or Reporting).
6. **Human merge** → optional later **combine repos** phase (closing slide).

---

## Hero progression (supporting context)

| Ticket | Seam |
| --- | --- |
| LIQ-9 | `#sales-summary` → `#revenue-summary` |
| LIQ-15 | `#invoice-performance` miss |
| LIQ-16 | Help centre dead on Reporting |
| LIQ-17 | Notifications dead on Reporting |
| **LIQ-24** | **AI Assistant BFF parity (demo hero)** |

Demo focuses **LIQ-24**; others show defect taxonomy and eval issue-specific checks ([08 · Eval](https://linear.app/liquid-accounting/document/08-deterministic-eval-rubric-reference-53c129d9cb9a)).

---

## Sample questions

- **Why not monorepo day one?** Matches enterprise staggered migration; SDK proves loop before structural merge.
- **What is “convergence” without merge?** Align contracts and chrome across repos with classified shared surface.
- **What after LIQ-24?** Narrated second act: same harness to extract shared package / single shell — out of live scope.

*Last updated: 2026-09-26.*
