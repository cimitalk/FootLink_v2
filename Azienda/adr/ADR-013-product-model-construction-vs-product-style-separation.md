# ADR-013: Separazione Ontologica e Funzionale tra Modello (Costruzione) e Prodotto (Stile) e Immutabilità di Forma e Scala Taglie

**Stato:** Approvato (Direttive Founder FTL-CEO-025 e FTL-CEO-026)  
**Data:** 28 Ottobre 2026  
**Decisori:** Founder, CEO, CPO, CTO  
**Contesto di Riferimento:** Epoca II ("La Verticalizzazione"), Sprint 8 — Consolidamento Modelli PLM/PIM  

---

## 1. Contesto e Motivazione

Nelle prassi manifatturiere calzaturiere e della pelletteria d'alta gamma, esiste una netta distinzione tra l'ingegneria di base della calzatura e la sua interpretazione stilistico-commerciale:

1. **FTL-CEO-025 — Scala taglie e FORMA / CARTAMODELLO a livello di modello:**
   - La forma in legno/resina (*last code*), il cartamodello CAD 3D e la scala taglie certificata definiscono la calzata, il volume geometrico e l'assetto ortopedico/strutturale della scarpa.
   - Consentire l'inserimento o la modifica eterogenea di scala taglie e forma a livello di singolo prodotto o variante generava asincronie tecniche, rischi di scarti in orlatura/montaggio e confusione gestionale tra le declinazioni commerciali dello stesso ceppo tecnico.
   - **Direttiva:** Sia la scala taglie che la forma/cartamodello devono essere configurate e manutenute **soltanto** a livello di modello e mai a livello di prodotto (in edit di prodotto non deve essere possibile modificare la scala taglie).

2. **FTL-CEO-026 — Definizione Ontologica di Prodotto e di Modello:**
   - *"Un modello rappresenta la forma e le caratteristiche tecniche di come viene effettuato il prodotto. Il prodotto è la declinazione di un modello, in un determinato materiale (o combinazione di materiali) e colore (o combinazione di colori). Il modello è la costruzione, il prodotto è lo stile."*
   - **Direttiva:** Rivedere funzionalmente tutte le maschere operative e i componenti del PLM e PIM affinché questa legge d'oro manifatturiera sia immediatamente visibile, auto-evidente e tecnicamente inviolabile.

---

## 2. Decisioni Architetturali e Operative

### 2.1 Assioma Ontologico: Modello (Costruzione) vs Prodotto (Stile)
- **Modello di Base = La Costruzione (Ingegneria Manifatturiera):**
  - Definisce: `last_code` (Codice Forma/Cartamodello), `sole_construction` (Metodo Costruttivo: Goodyear a guardolo cucito, Blake, Strobel, Montato Tradizionale, Vulcanizzato, San Crispino), `heel_height_mm`, `default_size_range` (Scala Taglie Certificata), genere/categoria e disegno CAD 3D.
  - È la **sede unica e autoritativa** per qualsiasi modifica geometrica o di sviluppo taglie.
- **Prodotto PLM / SKU PIM = Lo Stile (Espressione Commerciale e Variante):**
  - È l'istanza del Modello declinata in: materiali (pellame di tomaia, fodera, soletto, suola, minuteria metallica), palette colori (*colorway*), distinte base (BOM multilivello L1/L2/L3), listini wholesale/retail e canali distributivi.
  - La geometria strutturale e la scala taglie sono immutable nel Prodotto e provengono per ereditarietà obbligatoria dal Modello associato.

### 2.2 Blindatura dell'Interfaccia Utente (UX/UI Enforcement)
Tutte le maschere operative sono state riviste e uniformate per riflettere questo assioma senza eccezioni:

1. **Creazione Nuovo Prodotto PLM (`PlmProductsManager.tsx` -> `showCreateModal`):**
   - I campi `Forma / Cartamodello` e `Scala Taglie` sono impostati su `disabled readOnly`, contrassegnati con badge `🔒 Ereditata dal Modello Base (FTL-CEO-025)`.
   - Il tipo di costruzione viene lockato in base al modello selezionato (`🔒 Fissata dal Modello`).
   - L'operatore si concentra esclusivamente sugli attributi di stile: pellame/materiali, variante colore, nome commerciale, piramide di collezione e stagionalità.

2. **Modifica Rapida Prodotto PLM (`PlmProductsManager.tsx` -> `showQuickEditModal`):**
   - Banner direttivo superiore in risalto con richiamo alla direttiva Founder.
   - I campi `Codice Forma / Cartamodello`, `Scala Taglie Certificata` e `Tipo di Costruzione della Suola` sono visivamente bloccati e resi `readOnly disabled` con indicazione esplicita:
     > *"🔒 Vincolata al Modello di Base — Modificabile unicamente nella scheda 📐 Modelli (FTL-CEO-025 / FTL-CEO-026)"*.

3. **Duplicazione Profonda Prodotto / Stile (`PlmProductsManager.tsx` -> `showDeepCloneModal`):**
   - Il campo `Scala Taglie` è bloccato (`readOnly disabled`), con spiegazione operativa:
     > *"🔒 Ereditata dal Modello di Base. La duplicazione genera una nuova declinazione di Stile (colore/materiali) mantenendo inalterata la costruzione tecnica"*.

4. **Bridge PIM -> PLM (`PimToPlmBridge.tsx`):**
   - I campi `sizeRange` e `lastOrPattern` presentano lock visivo e indicazione `🔒 Modello (FTL-CEO-025)`.

5. **Gestione Modelli di Stile (`ProductModelsManager.tsx`):**
   - Inserito un banner executive permanente:
     > *"📐 Direttiva Fondatore (FTL-CEO-025 / FTL-CEO-026): Il Modello è la Costruzione, il Prodotto è lo Stile. La forma geometrica (last), il cartamodello CAD 3D, la tipologia di costruzione e la scala taglie certificata risiedono unicamente a livello di Modello."*
   - Nel form del Modello i campi tecnici `last_code` e `default_size_range` sono evidenziati con badge dorato `⭐ Sede Unica (FTL-CEO-025)`.

---

## 3. Conseguenze e Vantaggi

- **Integrità Tecnica Manifatturiera:** Impossibilità per gli operatori di generare inconsistenze di montaggio su scarpe dello stesso modello (eliminazione totale di varianti con scale taglie difformi o forme non collaudate).
- **Semplicità e Chiarezza d'Uso:** L'operatore di stile/commerciale compila solo dati stilistici e di colore; l'ingegnere di prodotto gestisce la costruzione geometrica nei Modelli.
- **Continuità con il Modello Dati Relazionale:** Piena sinergia con la relazione 1:N introdotta in ADR-012 (`product_models` -> `pim_commercial_items` -> `plm_product_variants`).
- **Verifica e Qualità:** Tutte le 40 suite Pytest passano al 100%, TypeScript build 0 errori, conformità L6 garantita a costo zero (FinOps L2 = 0 €).
