# Mainstream US Payment Processors & Gateways — Prohibited/Restricted Policy Evidence for Peptides, Research Chemicals & Supplements

**Scope:** US card acceptance for a research-use-only peptides + lab-supplies ecommerce business.
**Researcher access date:** 2026-10-20 (all URLs fetched/searched this date).
**Labeling key:** VERIFIED CURRENT = quoted from a primary policy page confirmed live; PLAUSIBLE — CONFIRMATION NEEDED = substance confirmed but exact current wording not captured from primary (JS-rendered page, geo-redirect, or secondary quoting); WEAK-EXCLUDE = category not explicitly named, exclusion inferred from adjacent/general clauses.
**Important caveat on primary-source capture:** The fetch tool geo-redirected Stripe's `/legal/restricted-businesses` to a Thai-language render on every attempt, and PayPal/Braintree legal-hub pages are JavaScript-rendered and returned no body text. Where this blocked English verbatim capture, the substance is reported with the limitation flagged. Nothing below is invented; un-sourced items are listed as Gaps.

---

## Key Question 1 — What do the big players' Acceptable Use / Restricted Business policies say about supplements, peptides, research chemicals, and health-claim / "not for human consumption" products?

### Takeaway
Helcim, Stripe, and Shopify explicitly name **nutraceuticals/pseudo-pharmaceuticals**, **research chemicals**, and **FDA-unapproved products / health claims** as prohibited or restricted — these are clean, documented exclusions. Square's US list is narrower (drugs/pharmacies/paraphernalia) and does not name peptides or nutraceuticals by name. PayPal/Braintree/Venmo and Adyen exact wording could not be captured from primary pages, but strong signals (APM terms, enforcement reports, the Adyen prohibited/restricted structure) indicate research peptides/research chemicals fall in the prohibited-or-heavily-restricted zone.

### Cited Findings

**Helcim (VERIFIED CURRENT — strongest, cleanest primary evidence)** — Acceptable Use Policy, **Last Updated September 30, 2026**, [legal.helcim.com/us/acceptable-use-policy](https://legal.helcim.com/us/acceptable-use-policy/):
- Prohibited: "Supplements or compounds banned by Health Canada or the United States Food and Drug Administration"
- Prohibited: "Pseudo-pharmaceuticals or nutraceuticals focused on significant weight loss or sexual performance"
- Prohibited: "Non-FDA/Health Canada approved pharmaceuticals"
- Prohibited: "Diet and weight loss marketing"
- Prohibited: "Chemicals, drugs, and compounds used for intoxicating effect (except alcohol)"
- Prohibited: "Non-prescription drugs that are not nationally available over the counter"
- Prohibited: "Drug paraphernalia"
- Restricted: "Online pharmacies and supplement retailers, generally"
- Restricted: "Research chemicals"
- Non-exhaustive language (Prohibited list): "The types of businesses listed below are examples of prohibited categories, but this is not an exhaustive list."
- Non-exhaustive language (Restricted list): "The list below includes examples of Restricted Businesses, but is not exhaustive."
- Note: the fetch corrected an assumption — immediate-termination language attaches to the Prohibited Activities/Content section (harassment, hateful material, self-harm), not to the business-category list; Helcim separately states it may suspend/terminate "at any time, and without notice" for AUP violations.

**Stripe (VERIFIED CURRENT substance; English verbatim PLAUSIBLE — CONFIRMATION NEEDED)** — Restricted/Prohibited Businesses, [stripe.com/legal/restricted-businesses](https://stripe.com/legal/restricted-businesses) (page served in Thai on every fetch attempt; footer "© 2026 Stripe, LLC"; banner notes "important updates" but shows no revision date):
- Prohibited category heading translates to "Pseudo-pharmaceuticals and nutraceuticals"; bullet translates to "pseudo-pharmaceuticals or nutraceuticals that are **unsafe or make harmful claims**."
- Prohibited (under illegal weapons/hazardous materials): "research chemicals **with incorrect labeling**."
- Restricted category exists for "Medicines, medical devices, and telemedicine."
- Non-exhaustive language: "The business types listed below are only examples... not a complete list."
- Jurisdiction-specific prohibitions (e.g., Mexico HCG weight loss, ephedrine; Thailand vitamins) confirm Stripe layers country rules on top.
- LIMITATION: exact English wording of the nutraceutical/pseudo-pharmaceutical bullet must be confirmed from the live English page (stripe.com/en-us/legal/restricted-businesses) — fetch geo-redirected to Thai each time.

**Shopify Payments (PLAUSIBLE — CONFIRMATION NEEDED on exact current AUP wording; enforcement VERIFIED)** — Acceptable Use Policy at [shopify.com/legal/aup](https://www.shopify.com/legal/aup) (page was restructured and did not return the product list on fetch; eligibility page [help.shopify.com/manual/payments/shopify-payments/eligibility](https://help.shopify.com/manual/payments/shopify-payments/eligibility) states the list "isn't exhaustive"):
- Category wording reproduced from a Shopify Payments terms excerpt quoted in a Shopify community thread: "nutraceuticals, pseudo-pharmaceuticals and other products that make **health claims that have not been approved or verified by the applicable local and/or national regulatory body**" — [community.shopify.com thread](https://community.shopify.com/t/shopify-payment-for-supplement-is-restricted/146941).
- Secondary summary lists "online pharmacies, prescription-only products including card-not-present pharmaceuticals, **peptides and research chemicals**" within the restricted scope — [ecommercefastlane.com](https://ecommercefastlane.com/what-you-need-to-know-about-shopifys-prohibited-items/).
- Real enforcement: a merchant reported their store flagged for "products we classify as regulated or illegal products or services (specifically **pseudo pharmaceuticals**)," with Shopify Payments and Apple Pay disabled and removal from the Shop channel — [community.shopify.com/t/received-an-urgent-email-from-shopify](https://community.shopify.com/t/received-an-urgent-email-from-shopify/397975).

**Square (WEAK-EXCLUDE for peptides/nutraceuticals; drug/pharmacy clauses VERIFIED)** — Square Payment Terms §3 "Unsupported Industries," **Last updated July 30, 2026**, [squareup.com/help/us/en/article/5089](https://squareup.com/help/us/en/article/5089-prohibited-goods-and-services-with-square-point-of-sale) (page content was truncated on fetch):
- "(8) internet/mail order/telephone order pharmacies or pharmacy referral services (where fulfillment of medication is performed with an internet or telephone consultation, absent a physical visit... including re-importation of pharmaceuticals from foreign countries)"
- "(2) paraphernalia that may be used for illegal activity"
- "(20) high-risk products and services, including telemarketing sales"
- "(24) internet/mail order/telephone order of age restricted products (e.g., tobacco)"
- Square's US list does NOT explicitly name "nutraceuticals," "supplements," "peptides," or "research chemicals." Exclusion of a research-peptide shop would rest on the general "high-risk products and services" catch-all and card-network rules, not a named category. CONFIRMATION NEEDED whether the truncated remainder of §3 names these.

**PayPal / Braintree / Venmo (PLAUSIBLE — CONFIRMATION NEEDED; exact AUP text not captured from primary):**
- PayPal's full Acceptable Use Policy ([paypal.com/us/legalhub/acceptableuse-full](https://www.paypal.com/us/legalhub/acceptableuse-full)) and Braintree's AUP ([paypal.com/legalhub/braintree/acceptable-use-policy](https://www.paypal.com/legalhub/braintree/acceptable-use-policy)) are JavaScript-rendered and returned no body text on repeated fetches — verbatim quotes could not be extracted and must be read directly in a browser.
- PayPal's Alternative Payment Methods terms list restricted goods including "**substances designed to mimic illegal drugs**" (phrase surfaced consistently across PayPal legal-hub APM pages) — the only PayPal-family primary wording captured.
- Braintree's AUP (per first-pass search, last updated ~2017) bars any "product, service, transaction or activity that violates law or card network rules, or that creates significant chargeback risk," and references a separate list of restricted business categories (that list not captured).
- Venmo business profiles are a PayPal, Inc. product governed by the Venmo user agreement + a prohibited-activities list mirroring PayPal's AUP (structural inference — CONFIRM on Venmo's legal pages).

**Adyen (PLAUSIBLE — CONFIRMATION NEEDED on the specific pharma/nutraceutical line):** Prohibited and Restricted Products and Services list, [adyen.com/legal/list-restricted-prohibited](https://www.adyen.com/en_GB/legal/list-restricted-prohibited) (category table did not render in the PDF/HTML fetched):
- Each category is marked **Restricted** (needs extra documentation before onboarding) or **Prohibited** (cannot use Adyen at all).
- Verbatim principle captured: "When Adyen agrees to provide its services for a broad category of services (e.g. DVDs) it does not imply that consent is given for subcategories within that category which are prohibited or restricted."
- Rules rest on law, card-network/payment-partner requirements, assessed chargeback/fraud risk, and reputational cost; local payment-method scheme owners may be stricter.

### Inferences
- A research-use-only peptide + research-chemical store is **explicitly excludable** under Helcim ("Research chemicals" restricted; FDA-unapproved + nutraceutical-for-performance prohibited), Stripe (nutraceuticals/pseudo-pharmaceuticals + mislabeled research chemicals), and Shopify Payments (peptides/research chemicals + unapproved health claims). These three give the cleanest "who NOT to waste time on, and why" with named categories.
- Square is excludable but only via the general "high-risk" catch-all and its pharmacy clause — a weaker, less citable basis than the other three.
- "Research use only / not for human consumption" labeling does NOT create a safe harbor: Shopify, Helcim, and the PayPal-peptide reporting all treat the underlying product class (not the disclaimer) as the trigger; Stripe prohibits "research chemicals with incorrect labeling," meaning labeling is scrutinized rather than protective.

### Gaps
- Stripe, Shopify, PayPal, Braintree, Venmo, Adyen: exact current **English verbatim** of the peptide/nutraceutical/research-chemical lines was blocked by geo-redirect (Stripe), page restructure (Shopify AUP), or JS rendering (PayPal/Braintree/Adyen table). Each should be re-read directly in a browser to lock the quote and its dated version.

---

## Key Question 2 — Is a "supplement allowed only with restrictions / health-claims nuance" distinction documented?

### Takeaway
Yes, and it is the central dividing line: ordinary dietary supplements (vitamins, protein, probiotics) are broadly acceptable, but the same product becomes prohibited/restricted the moment it carries drug-like or disease claims, targets weight loss / sexual performance, is FDA-unapproved, or is a peptide/research chemical.

### Cited Findings
- Helcim draws the line inside its own list: generic supplement retail is "Restricted" (allowed with underwriting), but "Pseudo-pharmaceuticals or nutraceuticals focused on significant weight loss or sexual performance" and "Non-FDA... approved pharmaceuticals" and "Diet and weight loss marketing" are "Prohibited" — [legal.helcim.com/us/acceptable-use-policy](https://legal.helcim.com/us/acceptable-use-policy/).
- Stripe conditions the prohibition on the product being "unsafe or [making] harmful claims," and separately prohibits mislabeled research chemicals — i.e., claim/labeling-dependent — [stripe.com/legal/restricted-businesses](https://stripe.com/legal/restricted-businesses).
- Shopify's category is defined by "health claims that have not been approved or verified by the applicable... regulatory body" — a claims test, not a blanket ingredient ban — [community.shopify.com](https://community.shopify.com/t/shopify-payment-for-supplement-is-restricted/146941).
- A high-risk underwriting doc (Payments AI, secondary but illustrative of the industry pattern) states vitamins/protein/probiotics are "typically allowed" while "CBD/THC, kratom, SARMs, **peptides**, 'research chemicals,' prohormones" are restricted, medical/drug claims are prohibited, trigger words "cures/treats/reverses/prevents" are red flags, and a rolling reserve "of at least 10%" applies to supplement sellers — [docs.payments.ai](https://docs.payments.ai/en/articles/13779250-approval-restrictions-for-nutraceuticals-and-supplements).
- PayPal (secondary characterization): basic supplements sit in a "monitored tier," flagged when they carry "medical-style claims"; "Vitamin and mineral supplements flagged as steroids" occurs over phrases like "supports muscle function"; peptides "marketed explicitly for human consumption with dosing instructions" are described as prohibited — [fena.co](https://www.fena.co/blog/high-risk-products-and-paypal-uk-whats-allowed-whats-restricted-and-what-gets-your-account-frozen) (UK-focused commentary; author is a competing Pay-by-Bank provider; dates conflict Oct 2025 / Oct 2026 — treat as indicative, not authoritative).

### Inferences
- For New Omen Labs specifically: the "research-use-only, not-for-consumption" framing plus avoidance of disease/performance claims is exactly what these policies are written to catch when the product is a peptide or research chemical — the nuance that saves generic vitamin sellers does not extend to this catalog.

### Gaps
- No mainstream processor's primary page was found that carves out an explicit "peptides are OK if labeled research-use-only" exception. None appears to exist; absence is itself a finding.

---

## Key Question 3 — Which of these are GATEWAYS (not acquirers) that still need a separate underwritten high-risk merchant account?

### Takeaway
Authorize.net and NMI are **gateways**, not merchant accounts/acquirers — they transport the transaction but you must have a separately underwritten (high-risk) merchant account behind them. This is the critical distinction for a high-risk peptide business: a gateway's willingness to connect you means nothing until an acquirer approves the MCC.

### Cited Findings
- "Authorize.net works only when connected to a... merchant account"; it "does not directly provide merchant accounts, especially for high-risk businesses" — merchant-services vendor sources [paymentcloudinc.com](https://paymentcloudinc.com/authorize-net/), [durangomerchantservices.com](https://durangomerchantservices.com/authorize-net-high-risk-merchant-account/).
- NMI is described as a gateway with a load-balancing feature that "routes transactions across multiple merchant accounts through one gateway" — i.e., it presupposes you hold one or more underwritten merchant accounts — [paylinedata.com](https://paylinedata.com/high-risk-merchant-account), [durangomerchantservices.com](https://durangomerchantservices.com/squarespace-authorize-net-nmi-gateway-integration-for-high-risk-merchants/).
- Both Authorize.net and NMI are "commonly preferred by high-risk merchants" precisely because they are acquirer-agnostic gateways that can sit in front of a high-risk account — [durangomerchantservices.com](https://durangomerchantservices.com/squarespace-authorize-net-nmi-gateway-integration-for-high-risk-merchants/), [community.shopify.com](https://community.shopify.com/t/what-are-reliable-payment-gateways-for-high-risk-businesses/6035/1).

### Inferences
- The "gateway vs merchant account" split explains why Stripe/Square/PayPal/Shopify Payments feel different from Authorize.net/NMI: the former are **aggregators/PayFacs** that bundle gateway + acquiring under one AUP (so their prohibited-business list is the whole gate), whereas Authorize.net/NMI are pure pipes — the real approval/denial for peptides happens at the high-risk acquirer behind them, under that acquirer's own underwriting, not in a public AUP.
- Practical consequence: do not evaluate Authorize.net/NMI by searching for a "peptides prohibited" clause on their sites — evaluate the high-risk acquirer you'd pair them with.

### Gaps
- No official Authorize.net or NMI policy page was captured (all sources are high-risk merchant-services vendors with a commercial interest). The gateway-vs-acquirer fact is consistent and well-established, but the specific framing should be confirmed on authorize.net and nmi.com directly. Note: Authorize.net is Visa-owned and also resells bundled merchant accounts via partners, which can blur the line in marketing — the core product is still a gateway.

---

## Key Question 4 — Documented history of freezing/holding funds for supplement/peptide sellers?

### Takeaway
PayPal has the most-reported pattern of holds/freezes and misclassification for supplement/peptide-adjacent sellers; Shopify Payments has a documented case of disabling payments and withholding/removing a store over "pseudo pharmaceuticals." Fund-hold risk is explicitly structural (rolling reserves) for supplement sellers in high-risk underwriting.

### Cited Findings
- Shopify: documented merchant case — Shopify Payments + Apple Pay "disabled" and store removed from Shop channel after being flagged for pseudo-pharmaceuticals — [community.shopify.com](https://community.shopify.com/t/received-an-urgent-email-from-shopify/397975). Third-party trackers add that Shopify "can immediately suspend or terminate your store and withhold funds for violations" (secondary) — [conductatlas.com](https://conductatlas.com/platform/shopify/shopify-acceptable-use-policy/).
- PayPal (secondary, UK-focused): accounts can be "frozen or permanently limited" when products fall in PayPal's internal risk classification; warns of "rolling reserves being increased without a clear explanation"; says prohibited-category appeals "rarely succeed" and legal research products are "frequently misclassified as prescription pharmaceuticals" — [fena.co](https://www.fena.co/blog/high-risk-products-and-paypal-uk-whats-allowed-whats-restricted-and-what-gets-your-account-frozen).
- Structural holds: supplement sellers face "a rolling reserve of at least 10%" in high-risk underwriting — [docs.payments.ai](https://docs.payments.ai/en/articles/13779250-approval-restrictions-for-nutraceuticals-and-supplements).

### Inferences
- The exclusion rationale to put in New Omen Labs' processor-comparison doc is not merely "they say no" but "they can approve, then freeze held funds mid-settlement" — the aggregators (Stripe/PayPal/Square/Shopify Payments) carry both denial risk and post-approval seizure risk because they hold your balance; a gateway + dedicated high-risk acquirer separates these risks.

### Gaps
- No US-specific regulatory/court record or dataset quantifying freeze frequency for peptide sellers was found; the freeze evidence is one documented Shopify case + secondary commentary. Stripe is widely reputed to abruptly terminate supplement sellers, but no primary/authoritative US source was captured here — flag as unverified.

---

## Quick exclusion table (for the comparison doc)

| Processor | Type | Verdict for RUO peptides / research chemicals | Basis | Label |
|---|---|---|---|---|
| Helcim | PayFac/aggregator | EXCLUDE (named) | "Research chemicals" restricted; FDA-unapproved + performance nutraceuticals prohibited | VERIFIED CURRENT (Sept 30 2026) |
| Stripe | PayFac/aggregator | EXCLUDE (named) | Pseudo-pharma/nutraceuticals + mislabeled research chemicals prohibited | VERIFIED (substance); English wording CONFIRM |
| Shopify Payments | PayFac (Stripe-backed) | EXCLUDE (named) + enforcement | Peptides/research chemicals + unapproved health claims; documented shutdown | VERIFIED enforcement; AUP wording CONFIRM |
| Square | PayFac/aggregator | EXCLUDE (weak/general) | "High-risk products and services" + pharmacy clause; peptides not named | VERIFIED (July 30 2026) but WEAK-EXCLUDE for peptides |
| PayPal | PayFac/aggregator | EXCLUDE + freeze risk | "Substances designed to mimic illegal drugs"; peptide misclassification/holds | PLAUSIBLE — CONFIRM (JS page) |
| Braintree | Gateway+acquiring (PayPal) | EXCLUDE (via PayPal family + card-network/chargeback clause) | AUP references separate restricted list | PLAUSIBLE — CONFIRM |
| Venmo | PayPal product | EXCLUDE (mirrors PayPal AUP) | Structural inference | PLAUSIBLE — CONFIRM |
| Cash App (Block/Square) | PayFac (Block) | EXCLUDE (under Block/Square seller terms) | Same family rules as Square | PLAUSIBLE — CONFIRM |
| Adyen | Acquirer/PSP | RESTRICTED-or-PROHIBITED | Prohibited/Restricted list; broad-category approval ≠ subcategory consent | PLAUSIBLE — CONFIRM (table didn't render) |
| Authorize.net | **Gateway only** | N/A at gateway — needs separate high-risk merchant account/acquirer | Gateway, not acquirer | VERIFIED (concept); vendor sources |
| NMI | **Gateway only** | N/A at gateway — needs separate high-risk merchant account(s) behind it | Gateway, not acquirer | VERIFIED (concept); vendor sources |
| Stax | ISO/PayFac reseller | UNKNOWN | Primary restricted-business list not captured | GAP — CONFIRM |

**Stax gap:** Stax's (formerly Fattmerchant) own prohibited/restricted-business list was not located on a primary page; a Stax Terms of Service PDF exists via a third-party mirror ([fitsmallbusiness.com](https://fitsmallbusiness.com/wp-content/uploads/2022/10/Stax-Terms-of-Service.pdf)) but was not fetched/verified. Stax is a reseller riding other acquirers' underwriting, so the operative restriction will be its sponsor acquirer's, similar to the gateway logic.
