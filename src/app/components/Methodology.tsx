const SERIF = '"Libre Baskerville", Georgia, "Times New Roman", serif';

export function Methodology() {
  return (
    <div className="bg-slate-50 min-h-full">
      <article className="max-w-3xl mx-auto px-6 py-12 sm:px-8 sm:py-16">
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-8 sm:p-12">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500 mb-4">
            Methodology · v2026-04-27
          </div>
          <h1
            className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-2"
            style={{ fontFamily: SERIF, letterSpacing: '-0.01em' }}
          >
            Nexus Compendium
          </h1>
          <p className="text-base text-slate-600 mb-8 leading-relaxed">
            A structured meta-reading of the world's Voluntary Local Reviews.
          </p>

          <p className="text-sm sm:text-base text-slate-700 leading-relaxed italic border-l-2 border-slate-300 pl-4 mb-10">
            The Compendium converts the global VLR corpus from a heterogeneous
            narrative archive into a queryable, comparable evidence base. Every
            analytical claim it surfaces is bound to a verbatim passage in a
            specific public document. It is offered as a complement, not a
            substitute, to the institutional infrastructure that already exists
            around the Voluntary Local Review.
          </p>

          <section className="mb-10">
            <h2
              className="text-xl font-semibold text-slate-900 mb-3"
              style={{ fontFamily: SERIF }}
            >
              1. Position in the existing landscape
            </h2>
            <div className="text-sm text-slate-700 leading-relaxed space-y-4">
              <p>
                The Voluntary Local Review framework is curated by the United
                Nations Department of Economic and Social Affairs (UN DESA), in
                co-operation with UN-Habitat. UN DESA maintains the canonical
                listing of submitted reviews; their{' '}
                <em>Global Guiding Elements for VLRs</em> describe what a review
                should address. The Compendium operates on the same corpus but
                performs a different task: where UN DESA curates and showcases,
                the Compendium structures and compares.
              </p>
              <p>
                It is also distinct from the{' '}
                <em>
                  Global indicator framework for the Sustainable Development
                  Goals
                </em>{' '}
                (UN General Assembly resolution A/RES/71/313), the statistical
                backbone of SDG monitoring. That framework counts; the Compendium
                reads. Narrative governance content — institutional arrangements,
                policy coherence, political will — is not reducible to a Tier I /
                II / III indicator, and the two regimes answer complementary
                questions. The Compendium is also separate from the Voluntary
                National Reviews presented at the High-Level Political Forum,
                which operate at national rather than sub-national level.
              </p>
              <p>
                It is not a substitute for academic literature reviews of VLRs
                either. Those select a sample, read it qualitatively, and
                synthesise. The Compendium reads the full population, structures
                it against a stable schema, and exposes it at the unit of
                analysis — city × SDG × year × extracted item.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2
              className="text-xl font-semibold text-slate-900 mb-3"
              style={{ fontFamily: SERIF }}
            >
              2. The analytical approach, at a glance
            </h2>
            <div className="text-sm text-slate-700 leading-relaxed space-y-4">
              <p>
                The Compendium is built on three principles, applied identically
                to every document in the corpus.
              </p>
              <p>
                <strong>Verifiable grounding.</strong> Every analytical record
                resolves to a verbatim passage in a specific source document.
                Records that fail to round-trip against their source are excluded
                from the analytical base.
              </p>
              <p>
                <strong>Schema stability.</strong> The output shape — categories,
                analytical units, field definitions — is held stable across the
                corpus. When the schema changes, the corpus is re-processed
                end-to-end so cross-temporal comparisons remain anchored to one
                instrument at any given point in time.
              </p>
              <p>
                <strong>Graduated validation.</strong> A document advances
                through extraction only when each preceding stage produces
                complete, schema-valid output. Anomalies surface at the earliest
                stage at which they can be detected.
              </p>
              <p>
                Operationally, the Compendium combines classical{' '}
                <em>natural language processing</em> with{' '}
                <em>large-language-model-assisted extraction</em> inside a
                structured, audit-traceable pipeline. Each document moves through
                five stages.
              </p>
              <p>
                <strong>Acquisition and normalisation.</strong> Source documents
                are obtained from the UN DESA repository and from direct-submission
                and research channels, then converted from PDF into a structured,
                machine-readable form with language and metadata detected at
                ingest. Provenance — original document, page, paragraph — is
                recorded against every downstream record.
              </p>
              <p>
                <strong>Thematic segmentation.</strong> Documents are broken into
                thematic sections using NLP-based segmentation, including explicit
                SDG-chapter recognition. The boundary between a formally-structured
                SDG chapter and narrative front-matter is the basis on which
                content enters the per-SDG aggregate views.
              </p>
              <p>
                <strong>Structured extraction.</strong> Within each thematic
                section, large-language-model-assisted extraction identifies the
                analytical units the Compendium reasons over: <em>policies</em>{' '}
                (what governments report they are doing), <em>challenges</em>{' '}
                (what they report stands in the way), and <em>commitments</em>{' '}
                (what they pledge). Every extracted unit carries a verbatim
                quotation from its source paragraph; that quotation is the
                grounding contract — extractions that cannot reproduce their
                evidence are dropped before they reach classification.
              </p>
              <p>
                <strong>Classification.</strong> Each analytical unit is mapped
                onto a stable taxonomy of policy instruments, challenge classes,
                and commitment forms. The taxonomy is the Compendium's own
                analytical instrument — versioned, peer-reviewable, and held
                fixed across the corpus so that cross-city and cross-time
                comparison remain interpretable. A confidence signal accompanies
                each classification; low-confidence assignments enter a manual
                review queue rather than being silently accepted.
              </p>
              <p>
                <strong>Validation and corpus-level integrity checks.</strong>{' '}
                Each document and the corpus as a whole are tested against a
                battery of schema checks, coverage checks, and anomaly detectors
                before any output is exposed to public views. Documents that fail
                validation remain searchable but are excluded from aggregates
                until reprocessed.
              </p>
              <p>
                The combination is deliberate. Rule-based or keyword-based
                extraction is inadequate to the linguistic, structural, and
                multilingual heterogeneity of the global VLR corpus; large
                language models alone, without verifiable grounding, a fixed
                taxonomy, and graduated validation, produce fluent text without
                the auditability that international-organisation use requires.
                The Compendium pairs the two so that every extracted record is
                at once analytically rich and provably grounded in its source.
              </p>
              <p>
                Tools, model choices, prompt designs, and storage schema are
                internal and made available to partner institutions on request
                for methodological review.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2
              className="text-xl font-semibold text-slate-900 mb-3"
              style={{ fontFamily: SERIF }}
            >
              3. What the Compendium does not do
            </h2>
            <div className="text-sm text-slate-700 leading-relaxed space-y-4">
              <p>
                It does not rank cities. It does not infer outcomes from reported
                claims. It does not substitute for indicator-based monitoring.
                The patterns it surfaces are those already present in what cities
                have written; silences are evidence that cities do not report on
                something, not direct evidence of absence in practice — a
                property of the source material shared with UN DESA's listing
                itself.
              </p>
              <p>
                Coverage is reported transparently with each public view: the
                ingestion gap against the UN DESA repository, the proportion of
                documents with structurally complete SDG segmentation, and the
                fifteen languages currently processed. Aggregates respect the six
                UN-Habitat regional groupings and are not directly interchangeable
                with the UN Statistics Division's M49 classification.
              </p>
            </div>
          </section>

          <section className="mb-2">
            <h2
              className="text-xl font-semibold text-slate-900 mb-3"
              style={{ fontFamily: SERIF }}
            >
              4. Engagement
            </h2>
            <div className="text-sm text-slate-700 leading-relaxed">
              <p>
                Methodological review by partner institutions — UN DESA,
                UN-Habitat, the OECD, the World Bank, national planning ministries
                — is welcomed on three fronts: corpus reconciliation with the UN
                DESA listing, peer review of the analytical taxonomy, and
                independent audit of the verifiable-grounding guarantee. Requests
                may be addressed to{' '}
                <a
                  href="mailto:hello@nexusgovernance.eu"
                  className="text-blue-700 hover:underline underline-offset-2"
                >
                  hello@nexusgovernance.eu
                </a>
                .
              </p>
            </div>
          </section>

          <div className="border-t border-slate-200 pt-6 mt-12 text-xs text-slate-500 leading-relaxed">
            Cite as: Nexus Governance.{' '}
            <em>
              Nexus Compendium: a structured meta-reading of the Voluntary Local
              Review corpus — Methodology.
            </em>{' '}
            v2026-04-27.{' '}
            <a
              href="https://nexusgovernance.eu/governance-scan"
              className="text-slate-600 hover:underline underline-offset-2"
            >
              nexusgovernance.eu/governance-scan
            </a>
            .
          </div>
        </div>
      </article>
    </div>
  );
}
