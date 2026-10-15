---
status: accepted
---

# A Contact follows the person across Companies; Interactions record the Company at the time

In executive search the commercial relationship is with a *person* before it is with any firm: a partner meets someone at an event, keeps in touch for months, and the business arrives when that person moves into a role that hires. We first modelled a **Contact** as belonging to exactly one **Company** forever (a job change meant a new Contact) to keep history from silently moving between Companies. We reversed that: a Contact's Company is optional and is their *current* employer, editable when they move, and each **Interaction** stores the Company it was with *at the time* — so the person keeps one continuous history while each Company's history stays true.

## Considered Options

- **Contact follows the person; Interaction records its Company (chosen)** — one record per human, Company optional and mutable; history integrity moves from the Contact onto the Interaction.
- **One Contact per Company, permanent (the previous decision)** — rejected: the networking history built before a job change is stranded on the old record exactly when the person brings business at the new firm.
- **Separate "Lead" record converted into a Contact** — rejected: a conversion step splits the person's history in two, the same reason prospect firms are Companies rather than converted leads.
- **Contact with dated employment history across Companies** — rejected for now as disproportionate; recording the Company on each Interaction gives the same historical truth without modelling tenures.

## Consequences

- **Past Opportunities and Vacancies keep pointing at the Contact after a move.** An Acme Opportunity can list someone now at Globex; screens show them by name and role, and that is accepted.
- **A Company lists only its current Contacts.** Former employees appear in its history through the Interactions and Opportunities they took part in — there is no "former employees" section and no "no longer works here" flag.
- **Deleting a Company never deletes people.** Its Contacts survive without a Company, as do Interactions involving at least one Contact; only Interactions with no Contact go with it.
