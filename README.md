
# Crate-O?

Status: PRE ALPHA WORK IN PROGRESS -- planning for an alpha release in May 2023.

Crate-O is a  browser-based editor for  Research Object Crates  ([RO-Crate]). RO-Crate is a flexible, developer-friendly approach to linked-data description and packaging . Crate-O is designed to:
- describe files on a user’s computer and to add contextual information about those files
- OR, to skip the files and describe abstract contextual entities such as in a Cultural Collection or an encyclopaedia
- OR to annotate existing resources elsewhere on the web

NOTE: Crate-O is for Google Chrome and related browsers ONLY at this stage as it describes files on the users computer, and saves RO-Crate metadata there. We will be releasing a version that can be deployed as part of a service that accesses online resources directly, which will be compatible with other browsers (see the [Roadmap]).

While the current version of Crate-O  is designed for editing self-contained RO-Crates (and works fine with crates containing tens of thousands of entities) - our roadmap includes editing fragments of larger linked-data resources, and integration with Arkisto repositories such as the [Oni] repository, data API & search portal.

Crate-O is currently developed by the Language Data Commons of Australia ([LDaCA]), under the guidance of Peter Sefton as technical lead. If the tool is adopted in other contexts (we are in talks with a few groups about this)  then we aim to establish a steering committee / reference group to help guide development.



# History

Crate-O was inspired by and uses parts of a similar  tool known as [Describo].

Describo was created and funded by the University of Technology Sydney eResearch group in 2019, led by Peter Sefton, in partnership with Marco La Rosa as a development contractor and software architect. That collaboration created two versions:

1. A desktop version, based on Electron. This is [available](https://github.com/describo/desktop) at the Describo organization on github.
2. An [online version](https://github.com/Arkisto-Platform/describo-online), designed to work with File Sync and Share services such as Dropbox or OwnCloud – this was intended to replace the desktop version, as it had proved hard to deploy on university infrastructure but was never deployed at UTS due to a change in organisational priorities.

Subsequently, funding has come from the European Open Science Cloud and the [Nyingarn] project and Describo has evolved into several different versions for different purposes, with varying levels of support. Main [Describo] development is now hosted in an organization at Github. At present the membership list of the organisation is not public.


## Why a new tool?

Crate-O is built on a different development philosophy that Describo. Rather than multiple different applications for different contexts  we are working on a single adaptable and embedable browser based editing application, built on a fully featured RO-Crate library, [RO-Crate-js] that can be used in different modes as outlined above (describing files on disk, abstract collections, and eventually as an editor for RO-Crate style JSON-LD fragments). 

## Crate-O aims to be a general purpose tool

Crate-O will be a general-purpose RO-Crate editor that will work in a number of contexts with or without a server to store Crates. Because RO-Crate is built on JSON-LD, Crate-O can also be used as a simple general-purpose linked data editor, provided the use case aligns with the constraints imposed by RO-Crate, the main two of which are that (a) entities have to be serialised to JSON-LD in a  particular way, with a flattened @graph array of all entities, and (b) there is a entry-point entity known as the RO-Crate Root Dataset with a small number of required metadata fields that serves to package the JSON-LD @graph.

Crate-O will reuse:
- Describo Profiles as an initial starting point.  We also plan to support loading ontologies in other formats. Under consideration  are:
  - Schema.org style Schemas ([SoSS]s) packaged as JSON-LD.
   -  [OWL] ontologies, SHACL specifications and other RDF approaches.
 We do not yet know if other schemas ontologies will be transformed into Describo-style profiles or if we will support some other schema languages natively.
-  Describo-style [Data Packs] and other name authorities.

# Roadmap / Backlog

The following is an overview of the major goals / functions for Crate-O over 2023-2024 and when we expect to be working on the various aspects of the tool.

## Dataset  management (2023-Q2 - 2023-Q4)

Integration with [RO-Crate-Excel], for hybrid Crate-O / Spreadsheet description of datasets such as linguistic corpora or scientific data. In this mode, Crate-O will manage the top-level bibliographic-type metadata for a crate, in tandem with spreadsheets used for repetitive data entry about large numbers of files and their relationships.

## Schemas, Profiles & Ontologies (2023-Q2 - 2023Q4)

There are a number of ways that linked-data groups are using to describe profiles for RO-Crate and similar linked data projects. On our radar at the moment are:

-  Schema.org - style “Schemas” which describe linked-data entities; Classes, Properties and DefinedTerms in a simple structural way. As these entities are a packaged in a flat JSON-LD graph, they can be distributed as RO-Crates and edited directly using Crate-O or other RO-Crate tools.
-  Describo “profiles” which describe a Schema for an RO-Crate along with the layout of entry forms and name-authority lookups.
-  JSON (not JSON-LD) schemas as seen in Bioschemas
-  SHACL “shapes” that provide a schema; this has been raised by developers at the Indigenous Data Network [IDN] and is being explored by colleagues in the [RO-Crate] working group. 

It will take some time to work with our partners on which of  these approaches Crate-O should support, but In Q3 2023 we aim to support a toolchain which allows:

-  Schema.org style schemas (SoSS)s to be maintained in RO-Crate using Crate-O. This is already working for the [Language Data Commons Vocabulary].
-  A simple workflow for loading a SoSS into Crate-O to create a basic Profile/

## Data deposit (2023-Q3 - 2024-Q2)

Crate-O will support data deposit via repository specific plugins and/or standardized protocols (eg SWORD). The first implementation will target adding and updating resources in LDaCA repositories, and we will work with collaborators, including the Indigenous Data Network to discuss the key standards that need to be supported.

## Name authorities - dynamic “Data Packs” & other lookups (2023-Q2 - 2023-Q4)

A core tenet of Linked Data is that items are described using references to other entities via  as-stable-as-possible IDs, and RO-Crate encourages redundancy and including copies of at least minimal entities using those IDs. Describo Datapacks are one important way this has been implemented, but at present they are used with known sets of static data such as language and country codes (and possibly schemas such as those used by Schema.org).


## Annotation of existing collections / resources (Q3 2023 - ongoing )

The Language Data Commons of Australia ([LDaCA]) project is committed to developing Crate-O and [RO-Crate Excel] to allow community members to generate their own annotations of existing GLAM collections.

The initial use-case is to  allow Indigenous communities to identify resources held in institutional collections and describe:
-  The languages that resources contain, and the languages that they describe.
-  Context around collections and resources – what is known about the resources that is not in the archive.
-  Veracity determinations of data including cultural and community veracity
-  Traditional knowledges , further content and community perspectives 
-  Assertions about appropriate data-management eg by suggesting [TK Labels] as appropriate.

Annotation data objects will be made in a secure environment available to a selected cohorts of people, and when complete may go through a curation and publishing process. They will be made be made available either publicly or with restricted access via granting of an appropriate license. This publishing follows the principles we are using for all data - every data object has a license to be determined by the data steward and rights holder (in this case the cohort of annotators and/or the project for which they are working)

LDaCA plans to make suitable annotations available as part of the language-data portals we are building – they will act as a catalogue or directory of language resources. The hard social and technical work of getting these descriptions back into the source repositories and archives can take place on a different time-scale and this stand-off approach allows for communities to be data stewards of their own annotations and to work outside of colonial institutions.

This approach can potentially be used by any agent, to maintain their view of one or more collections, with additional context, errata or refutation and unlike centralized services like HuNI (1) will allow for individuals to create their own linked-data documents and datasets and to publish them anywhere (eg Github or Zenodo).

## Cultural Collections (Potential – no work yet scheduled)

Crate-O has been tested on cultural data collections, incidentally to an [ARDC] funded project to extract data from the OHRM, a legacy application for maintaining collections  (the project was presented the project at [this event](https://ardc.edu.au/article/advancing-hass-and-indigenous-research-infrastructure-a-symposium/).

Potential work on Cultural collections will be enabled by  the other functions we are planning to implement, such as; being able to add to name-authorities (such as adding new entities to a historically-focussed database or an encyclopedia), the ability to publish crates or fragments of crates and pathways for managing schemas, and maintenance of domain-specific schemas using Crate-O itself.

[IDN]: https://mspgh.unimelb.edu.au/centres-institutes/centre-for-health-equity/research-group/indigenous-data-network
[RO-Crate Excel]: https://github.com/Arkisto-Platform/ro-crate-excel
[RO-Crate]:  https://www.researchobject.org/ro-crate/
[OWL]: https://www.w3.org/OWL/
[SHACL]: https://www.w3.org/TR/shacl/
[SoSS]: https://schema.org/docs/schemas.html
[Language Data Commons Vocabulary]: https://purl.archive.org/language-data-commons-terms
[ARDC]: https://ardc.edu.au/
[LDaCA]: https://ldaca.edu.au
[RO-Crate-js]: https://github.com/Arkisto-Platform/ro-crate-js 
[Nyingarn]: https://nyingarn.net/
[Oni]: https://github.com/Arkisto-Platform/oni
[TK Labels]: https://localcontexts.org/labels/traditional-knowledge-labels/
[Describo]: https://github.com/Describo
[Arkisto]: https://arkisto-platform.github.io/
[Data Packs]: https://github.com/describo/data-packs




1.	Verhoeven D, Burrows T. Aggregating Cultural Heritage Data for Research Use: the Humanities Networked Infrastructure (HuNI). In: Garoufallou E, Hartley RJ, Gaitanou P, editors. Metadata and Semantics Research. Cham: Springer International Publishing; 2015. p. 417–23. (Communications in Computer and Information Science).
