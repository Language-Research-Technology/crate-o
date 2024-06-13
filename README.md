<!---Start--->
# Crate-O
<!---End--->
Status: Crate-O is now usable in Chromium-based browsers (Chrome, and Microsoft Edge work) - you can try it [here](https://language-research-technology.github.io/crate-o/), please let report bugs using Github issues in this repository.
<!---Start--->
Crate-O is a browser-based editor for  Research Object Crates  [(RO-Crate)](https://www.researchobject.org/ro-crate/). RO-Crate is a flexible, developer-friendly approach to linked-data description and packaging. Crate-O is designed to:
- describe files on a user’s computer and to add contextual information about those files
- optionally skip the files and describe abstract contextual entities such as in a Cultural Collection or an encyclopaedia
- annotate existing resources elsewhere on the web
- import bulk metadata from an Excel spreadsheet
<!---End--->
For more technical information on Crate-O, refer to the [Developer Documentation page](./docs)
<!---Start--->
NOTE: Crate-O is for Google Chrome and related browsers ONLY at this stage as it describes files on the users computer, and saves RO-Crate metadata there. We will be releasing a version that can be deployed as part of a service that accesses online resources directly, which will be compatible with other browsers (see the [Roadmap](https://github.com/Language-Research-Technology/crate-o#roadmap--backlog)).

While the current version of Crate-O  is designed for editing self-contained RO-Crates (and works fine with crates containing tens of thousands of entities) - our roadmap includes editing fragments of larger linked-data resources, and integration with Arkisto repositories such as the [Oni](https://github.com/Language-Research-Technology/oni) repository, data API & search portal.

Crate-O is currently developed by the Language Data Commons of Australia [(LDaCA)](https://www.ldaca.edu.au/), under the guidance of Peter Sefton as technical lead. If the tool is adopted in other contexts (we are in talks with a few groups about this)  then we aim to establish a steering committee / reference group to help guide development.
<!---End--->
# History

Crate-O was is a rewrite of a tool called [Describo]. Though members of the Crate-O tool were involved in its conception, funding and development we are no longer associated with that line of development.


## Crate-O aims to be a general purpose tool

Crate-O is designed to be a general-purpose RO-Crate editor that will work in a number of contexts with or without a server to store Crates. Because RO-Crate is built on JSON-LD, Crate-O can also be used as a simple general-purpose linked data editor, provided the use case aligns with the main constraints imposed by RO-Crate; that entities have to be serialized to JSON-LD in a  particular way, with a flattened @graph array of all entities.

# Configuring with Mode Files 
Crate-O uses [Mode Files](https://github.com/Language-Research-Technology/ro-crate-editor-profiles) to configure its behavious.

There are [command line tools available](https://github.com/Language-Research-Technology/ro-crate-schema-tools) to create Mode Files from Schema.org style Schemas ([SoSS]s). In future we may also support [OWL] ontologies, SHACL specifications and other RDF approaches.


# Roadmap / Backlog

The following is an overview of the major goals / functions for Crate-O over 2023-2024 and when we expect to be working on the various aspects of the tool.

## Dataset  management (2023-Q2 - 2023-Q4)

Progress has been made on integration with [RO-Crate-Excel], for hybrid Crate-O / Spreadsheet description of datasets such as linguistic corpora or scientific data. In this mode, Crate-O will manage the top-level bibliographic-type metadata for a crate, in tandem with spreadsheets used for repetitive data entry about large numbers of files and their relationships. 

## Schemas, Profiles & Ontologies (2023-Q2 - 2023Q4)

There are a number of ways that linked-data groups are using to describe profiles for RO-Crate and similar linked data projects. On our radar at the moment are:

- Done -- see the [RO-Crate Editor Modes](https://github.com/Language-Research-Technology/ro-crate-editor-profiles/blob/main/docs/soss-profiles.md):
  -  Use Schema.org - style “Schemas” which describe linked-data entities; Classes, Properties and DefinedTerms in a simple structural way. As these entities are a packaged in a flat JSON-LD graph, they can be distributed as RO-Crates and edited directly using Crate-O or other RO-Crate tools. (This is now implemented an explained here)

  -  Schema.org style schemas (SoSS)s to be maintained in RO-Crate using Crate-O. This is already working for the [Language Data Commons Vocabulary].
  
  -  A simple workflow for loading a SoSS into Crate-O to create a basic Profile/
-  NOT PURSUING:
  -  JSON (not JSON-LD) schemas as seen in Bioschemas
-  TODO: 
    -  SHACL “shapes” that provide a schema; this has been raised by developers at the Indigenous Data Network [IDN] and is being explored by colleagues in the [RO-Crate] working group. 



## Data deposit (push to a repository) (2023-Q3 - 2024-Q2)

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
[RO-Crate Excel]: https://github.com/Language-Research-Technology/ro-crate-excel



1.	Verhoeven D, Burrows T. Aggregating Cultural Heritage Data for Research Use: the Humanities Networked Infrastructure (HuNI). In: Garoufallou E, Hartley RJ, Gaitanou P, editors. Metadata and Semantics Research. Cham: Springer International Publishing; 2015. p. 417–23. (Communications in Computer and Information Science).