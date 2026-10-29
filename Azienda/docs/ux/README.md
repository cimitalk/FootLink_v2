# 🎨 UX/UI & Ergonomics Hub — Footlink

Questo hub documentale raccoglie tutte le direttive, specifiche ergonomiche, linee guida di design system e audit di usabilità emanate dal **Lead UX/UI Designer & Ergonomics Officer** di Footlink, in conformità al [Manifesto di Fondazione](../../Manifesto_Fondazione_Footlink.md), a [`Role_UX_Lead_Footlink.md`](../roles/Role_UX_Lead_Footlink.md), ad [`ADR-020`](../../adr/ADR-020-ux-ui-anti-redundancy-standards-and-design-lead-mandate.md) e [`ADR-021`](../../adr/ADR-021-model-detail-simplification-and-pim-commercial-delegation.md).

---

## 🏛️ Ruolo & Mandato di Governance
- **Titolare:** Lead UX/UI Designer & Ergonomics Officer (sub-agente `footlink-ux-lead`).
- **Reporting:** CPO (Prodotto & Dominio) e CMO (Brand & Posizionamento).
- **Potere di Veto (Design Review Gate):** Nessuna modifica all'interfaccia utente (SPA React o portali HTML) può essere rilasciata in produzione se introduce:
  1. Più di 2 livelli gerarchici di navigazione visibile contemporanea (*Anti-Horizontal Bloat*).
  2. Duplicazione di tasti primari o azioni di modifica sulla medesima entità (*Single Source of Action*).
  3. Sovrapposizione di scope contestuale (es. sticky bar o contesti di variante attivi in anagrafiche di base/forma).
  4. Ambiguità tra gestione tecnica/produttiva (PLM) e aggregazione commerciale (PIM).

---

## 📚 Deliverable & Linee Guida
1. [`design-system-ergonomics-guidelines-sprint-9.md`](./design-system-ergonomics-guidelines-sprint-9.md) — Standard di Usabilità, Coerenza e Anti-Ridondanza Sprint 9.
2. [`../roles/Role_UX_Lead_Footlink.md`](../roles/Role_UX_Lead_Footlink.md) — Mansionario e matrice RACI v1.0.
3. Decision Records Correlati:
   - [`ADR-020: Standard di Coerenza UX/UI, Eliminazione Ridondanze di Navigazione e Istituzione Presidio UX Lead`](../../adr/ADR-020-ux-ui-anti-redundancy-standards-and-design-lead-mandate.md)
   - [`ADR-021: Ottimizzazione Scheda Dettaglio Modello, Rimozione Azioni Duplicate e Delega Commerciale PIM a Modulo 03`](../../adr/ADR-021-model-detail-simplification-and-pim-commercial-delegation.md)
