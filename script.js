document.addEventListener("DOMContentLoaded", () => {
    const citationStyle = document.getElementById("citation-style");
    const sourceType = document.getElementById("source-type");

    const authorInput = document.getElementById("author");
    const yearInput = document.getElementById("year");
    const titleInput = document.getElementById("title");
    const publicationInput = document.getElementById("publication");
    const urlInput = document.getElementById("url");
    const doiInput = document.getElementById("doi");

    const generateBtn = document.getElementById("generate-btn");
    const copyBtn = document.getElementById("copy-btn");

    const citationResult = document.getElementById("citation-result");
    const citationText = document.getElementById("citation-text");
    const inTextCitation = document.getElementById("in-text-citation");
    const formMessage = document.getElementById("form-message");

    const currentYear = document.getElementById("current-year");

    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }

    /* =========================================================
       HELPERS
    ========================================================= */

    function clean(value) {
        return String(value || "").trim();
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function italic(value) {
        return `<em>${escapeHtml(value)}</em>`;
    }

    function quote(value) {
        return `“${escapeHtml(value)}”`;
    }

    function getSelectedContext() {
        const selected = document.querySelector(
            'input[name="citation-context"]:checked'
        );

        return selected ? selected.value : "international";
    }

    function normalizeUrl(value) {
        const url = clean(value);

        if (!url) {
            return "";
        }

        if (/^https?:\/\//i.test(url)) {
            return url;
        }

        return `https://${url}`;
    }

    function normalizeDoi(value) {
        let doi = clean(value);

        if (!doi) {
            return "";
        }

        doi = doi
            .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
            .replace(/^doi:\s*/i, "");

        return doi;
    }

    function parseAuthors(value) {
        return clean(value)
            .split(/\s*(?:;|\n)\s*/)
            .map(item => item.trim())
            .filter(Boolean);
    }

    function getLastName(name) {
        const parts = clean(name).split(/\s+/);

        if (!parts.length) {
            return "";
        }

        return parts[parts.length - 1];
    }

    function getInitials(name) {
        const parts = clean(name)
            .replace(/,/g, "")
            .split(/\s+/)
            .filter(Boolean);

        if (!parts.length) {
            return "";
        }

        const lastName = parts.pop();

        const initials = parts
            .map(part => `${part.charAt(0).toUpperCase()}.`)
            .join(" ");

        return initials
            ? `${lastName}, ${initials}`
            : lastName;
    }

    function apaAuthors(authors) {
        if (!authors.length) {
            return "";
        }

        const formatted = authors.map(getInitials);

        if (formatted.length === 1) {
            return formatted[0];
        }

        if (formatted.length === 2) {
            return `${formatted[0]}, & ${formatted[1]}`;
        }

        return `${formatted.slice(0, -1).join(", ")}, & ${formatted[formatted.length - 1]}`;
    }

    function mlaAuthors(authors) {
        if (!authors.length) {
            return "";
        }

        if (authors.length === 1) {
            return authors[0];
        }

        if (authors.length === 2) {
            return `${authors[0]}, and ${authors[1]}`;
        }

        return `${authors[0]}, et al.`;
    }

    function chicagoAuthors(authors) {
        if (!authors.length) {
            return "";
        }

        return authors.join(", ");
    }

    function harvardAuthors(authors) {
        if (!authors.length) {
            return "";
        }

        return authors.map(getInitials).join(", ");
    }

    function ieeeAuthors(authors) {
        if (!authors.length) {
            return "";
        }

        return authors
            .map(name => {
                const parts = clean(name).split(/\s+/);
                if (parts.length === 1) {
                    return parts[0];
                }

                const last = parts.pop();
                const initials = parts
                    .map(part => `${part.charAt(0).toUpperCase()}.`)
                    .join(" ");

                return `${initials} ${last}`;
            })
            .join(", ");
    }

    function vancouverAuthors(authors) {
        if (!authors.length) {
            return "";
        }

        return authors
            .map(name => {
                const parts = clean(name).split(/\s+/);

                if (parts.length === 1) {
                    return parts[0];
                }

                const last = parts.pop();
                const initials = parts
                    .map(part => part.charAt(0).toUpperCase())
                    .join("");

                return `${last} ${initials}`;
            })
            .join(", ");
    }

    function formatDate(value) {
        const date = clean(value);

        if (!date) {
            return "";
        }

        const parsed = new Date(date);

        if (Number.isNaN(parsed.getTime())) {
            return date;
        }

        return parsed.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    }

    function getField(id) {
        const element = document.getElementById(id);
        return element ? clean(element.value) : "";
    }

    /* =========================================================
       DYNAMIC FIELD CREATION
    ========================================================= */

    let dynamicFieldsContainer = document.getElementById(
        "dynamic-fields-container"
    );

    if (!dynamicFieldsContainer) {
        dynamicFieldsContainer = document.createElement("div");
        dynamicFieldsContainer.id = "dynamic-fields-container";

        const doiElement = doiInput;

        if (doiElement) {
            const doiGroup =
                doiElement.closest(".form-group") ||
                doiElement.parentElement;

            if (doiGroup && doiGroup.parentNode) {
                doiGroup.parentNode.insertBefore(
                    dynamicFieldsContainer,
                    doiGroup.nextSibling
                );
            }
        }
    }

    function createField({
        id,
        label,
        placeholder = "",
        type = "text",
        required = false,
        help = ""
    }) {
        const wrapper = document.createElement("div");
        wrapper.className = "form-group dynamic-field";
        wrapper.dataset.dynamicField = id;

        const labelElement = document.createElement("label");
        labelElement.setAttribute("for", id);
        labelElement.textContent = label;

        wrapper.appendChild(labelElement);

        let input;

        if (type === "textarea") {
            input = document.createElement("textarea");
            input.rows = 3;
        } else {
            input = document.createElement("input");
            input.type = type;
        }

        input.id = id;
        input.placeholder = placeholder;

        if (required) {
            input.required = true;
        }

        wrapper.appendChild(input);

        if (help) {
            const helpText = document.createElement("small");
            helpText.className = "field-help";
            helpText.textContent = help;
            wrapper.appendChild(helpText);
        }

        return wrapper;
    }

    function addField(config) {
        dynamicFieldsContainer.appendChild(
            createField(config)
        );
    }

    function clearDynamicFields() {
        dynamicFieldsContainer.innerHTML = "";
    }

    /* =========================================================
       SOURCE CONFIGURATION
    ========================================================= */

    const internationalSources = [
        {
            value: "website",
            label: "Website"
        },
        {
            value: "book",
            label: "Book"
        },
        {
            value: "journal",
            label: "Journal Article"
        }
    ];

    const indiaSources = [
        {
            value: "website",
            label: "Website"
        },
        {
            value: "book",
            label: "Book"
        },
        {
            value: "journal",
            label: "Journal Article"
        },
        {
            value: "government-report",
            label: "Government Report"
        },
        {
            value: "government-ministry",
            label: "Government Ministry"
        },
        {
            value: "indian-kanoon",
            label: "Indian Kanoon"
        },
        {
            value: "supreme-court",
            label: "Supreme Court of India"
        },
        {
            value: "high-court",
            label: "High Court of India"
        },
        {
            value: "gazette",
            label: "Gazette Notification"
        },
        {
            value: "rbi",
            label: "RBI Publication"
        },
        {
            value: "sebi",
            label: "SEBI Publication"
        },
        {
            value: "pib",
            label: "PIB Press Release"
        },
        {
            value: "newspaper",
            label: "Newspaper Article"
        },
        {
            value: "legislation",
            label: "Act / Legislation"
        }
    ];

    function updateSourceTypes() {
        if (!sourceType) {
            return;
        }

        const context = getSelectedContext();

        const sources =
            context === "india"
                ? indiaSources
                : internationalSources;

        const previousValue = sourceType.value;

        sourceType.innerHTML = "";

        sources.forEach(source => {
            const option = document.createElement("option");

            option.value = source.value;
            option.textContent = source.label;

            sourceType.appendChild(option);
        });

        const stillExists = sources.some(
            source => source.value === previousValue
        );

        if (stillExists) {
            sourceType.value = previousValue;
        } else {
            sourceType.value = sources[0].value;
        }

        updateSourceFields();
    }

    /* =========================================================
       DYNAMIC SOURCE FIELDS
    ========================================================= */

    function updateSourceFields() {
        clearDynamicFields();

        const context = getSelectedContext();
        const source = sourceType ? sourceType.value : "website";

        /*
         * INTERNATIONAL WEBSITE
         */
        if (
            context === "international" &&
            source === "website"
        ) {
            addField({
                id: "access-date",
                label: "Access Date",
                type: "date",
                help: "Optional — useful for APA, MLA and Harvard."
            });
        }

        /*
         * INTERNATIONAL JOURNAL
         */
        if (
            context === "international" &&
            source === "journal"
        ) {
            addField({
                id: "volume",
                label: "Volume",
                placeholder: "e.g. 12"
            });

            addField({
                id: "issue",
                label: "Issue",
                placeholder: "e.g. 3"
            });

            addField({
                id: "pages",
                label: "Pages",
                placeholder: "e.g. 145–162"
            });
        }

        /*
         * INDIA — GOVERNMENT REPORT
         */
        if (source === "government-report") {
            addField({
                id: "organisation",
                label: "Ministry / Department / Organisation",
                placeholder: "e.g. Ministry of Finance"
            });

            addField({
                id: "report-number",
                label: "Report Number",
                placeholder: "e.g. Report No. 12/2026"
            });

            addField({
                id: "report-date",
                label: "Report Date",
                type: "date"
            });
        }

        /*
         * INDIA — GOVERNMENT MINISTRY
         */
        if (source === "government-ministry") {
            addField({
                id: "ministry",
                label: "Ministry / Department",
                placeholder: "e.g. Ministry of Electronics and IT"
            });

            addField({
                id: "document-number",
                label: "Document / Notification Number",
                placeholder: "Optional"
            });

            addField({
                id: "document-date",
                label: "Publication Date",
                type: "date"
            });
        }

        /*
         * INDIA — INDIAN KANOON
         */
        if (source === "indian-kanoon") {
            addField({
                id: "court",
                label: "Court",
                placeholder: "e.g. Supreme Court of India",
                required: true
            });

            addField({
                id: "case-number",
                label: "Case / Appeal Number",
                placeholder: "e.g. Civil Appeal No. 1234 of 2026"
            });

            addField({
                id: "judgment-date",
                label: "Judgment Date",
                type: "date",
                required: true
            });

            addField({
                id: "case-citation",
                label: "Law Report / Citation",
                placeholder: "e.g. (1995) 1 SCC 478"
            });

            addField({
                id: "bench",
                label: "Judge(s) / Bench",
                placeholder: "e.g. D.Y. Chandrachud, J."
            });
        }

        /*
         * INDIA — SUPREME COURT
         */
        if (source === "supreme-court") {
            addField({
                id: "court",
                label: "Court",
                placeholder: "Supreme Court of India",
                required: true
            });

            addField({
                id: "case-number",
                label: "Case / Appeal Number",
                placeholder: "e.g. Civil Appeal No. 1234 of 2026"
            });

            addField({
                id: "judgment-date",
                label: "Judgment Date",
                type: "date",
                required: true
            });

            addField({
                id: "case-citation",
                label: "Law Report / Citation",
                placeholder: "e.g. (2026) 5 SCC 123"
            });

            addField({
                id: "bench",
                label: "Judge(s) / Bench",
                placeholder: "e.g. A.B. CJI, C.D. J."
            });
        }

        /*
         * INDIA — HIGH COURT
         */
        if (source === "high-court") {
            addField({
                id: "court",
                label: "High Court",
                placeholder: "e.g. Bombay High Court",
                required: true
            });

            addField({
                id: "case-number",
                label: "Case / Petition Number",
                placeholder: "e.g. Writ Petition No. 1234 of 2026"
            });

            addField({
                id: "judgment-date",
                label: "Judgment Date",
                type: "date",
                required: true
            });

            addField({
                id: "case-citation",
                label: "Law Report / Citation",
                placeholder: "Optional"
            });

            addField({
                id: "bench",
                label: "Judge(s) / Bench",
                placeholder: "e.g. G.S. Patel, J."
            });
        }

        /*
         * INDIA — GAZETTE
         */
        if (source === "gazette") {
            addField({
                id: "issuing-authority",
                label: "Issuing Authority",
                placeholder: "e.g. Ministry of Finance",
                required: true
            });

            addField({
                id: "notification-number",
                label: "Notification Number",
                placeholder: "e.g. S.O. 1234(E)"
            });

            addField({
                id: "gazette-date",
                label: "Notification Date",
                type: "date",
                required: true
            });

            addField({
                id: "gazette-part",
                label: "Gazette Part / Section",
                placeholder: "Optional"
            });
        }

        /*
         * INDIA — RBI
         */
        if (source === "rbi") {
            addField({
                id: "rbi-document-type",
                label: "RBI Document Type",
                placeholder: "e.g. Notification, Circular, Report"
            });

            addField({
                id: "rbi-number",
                label: "Notification / Circular Number",
                placeholder: "e.g. RBI/2026-27/45"
            });

            addField({
                id: "rbi-date",
                label: "Publication Date",
                type: "date",
                required: true
            });
        }

        /*
         * INDIA — SEBI
         */
        if (source === "sebi") {
            addField({
                id: "sebi-document-type",
                label: "SEBI Document Type",
                placeholder: "e.g. Circular, Regulation, Report"
            });

            addField({
                id: "sebi-number",
                label: "Circular / Reference Number",
                placeholder: "e.g. SEBI/HO/..."
            });

            addField({
                id: "sebi-date",
                label: "Publication Date",
                type: "date",
                required: true
            });
        }

        /*
         * INDIA — PIB
         */
        if (source === "pib") {
            addField({
                id: "pib-ministry",
                label: "Ministry / Department",
                placeholder: "e.g. Ministry of Finance"
            });

            addField({
                id: "pib-release-number",
                label: "Press Release Number",
                placeholder: "e.g. PIB/2026/123"
            });

            addField({
                id: "pib-date",
                label: "Release Date",
                type: "date",
                required: true
            });
        }

        /*
         * INDIA — NEWSPAPER
         */
        if (source === "newspaper") {
            addField({
                id: "edition",
                label: "Edition / City",
                placeholder: "e.g. Mumbai"
            });

            addField({
                id: "publication-date",
                label: "Publication Date",
                type: "date",
                required: true
            });
        }

        /*
         * INDIA — LEGISLATION
         */
        if (source === "legislation") {
            addField({
                id: "act-number",
                label: "Act Number",
                placeholder: "e.g. Act No. 21 of 2026"
            });

            addField({
                id: "issuing-authority",
                label: "Issuing Authority",
                placeholder: "e.g. Parliament of India"
            });

            addField({
                id: "act-date",
                label: "Date / Year",
                type: "date"
            });
        }
    }

    /* =========================================================
       FORM DATA
    ========================================================= */

    function collectData() {
        return {
            context: getSelectedContext(),
            style: citationStyle ? citationStyle.value : "apa",
            source: sourceType ? sourceType.value : "website",

            author: clean(authorInput?.value),
            authors: parseAuthors(authorInput?.value),
            year: clean(yearInput?.value),
            title: clean(titleInput?.value),
            publication: clean(publicationInput?.value),
            url: normalizeUrl(urlInput?.value),
            doi: normalizeDoi(doiInput?.value),

            accessDate: getField("access-date"),

            volume: getField("volume"),
            issue: getField("issue"),
            pages: getField("pages"),

            organisation: getField("organisation"),
            reportNumber: getField("report-number"),
            reportDate: getField("report-date"),

            ministry: getField("ministry"),
            documentNumber: getField("document-number"),
            documentDate: getField("document-date"),

            court: getField("court"),
            caseNumber: getField("case-number"),
            judgmentDate: getField("judgment-date"),
            caseCitation: getField("case-citation"),
            bench: getField("bench"),

            issuingAuthority: getField("issuing-authority"),
            notificationNumber: getField("notification-number"),
            gazetteDate: getField("gazette-date"),
            gazettePart: getField("gazette-part"),

            rbiDocumentType: getField("rbi-document-type"),
            rbiNumber: getField("rbi-number"),
            rbiDate: getField("rbi-date"),

            sebiDocumentType: getField("sebi-document-type"),
            sebiNumber: getField("sebi-number"),
            sebiDate: getField("sebi-date"),

            pibMinistry: getField("pib-ministry"),
            pibReleaseNumber: getField("pib-release-number"),
            pibDate: getField("pib-date"),

            edition: getField("edition"),
            publicationDate: getField("publication-date"),

            actNumber: getField("act-number"),
            actDate: getField("act-date")
        };
    }

    /* =========================================================
       VALIDATION
    ========================================================= */

    function validateData(data) {
        if (!data.title) {
            return "Please enter the title.";
        }

        const legalSources = [
            "indian-kanoon",
            "supreme-court",
            "high-court"
        ];

        const legislationSources = [
            "legislation"
        ];

        if (
            !legalSources.includes(data.source) &&
            !legislationSources.includes(data.source) &&
            !data.author
        ) {
            return "Please enter the author / writer.";
        }

        if (
            legalSources.includes(data.source) &&
            !data.court
        ) {
            return "Please enter the court.";
        }

        if (
            legalSources.includes(data.source) &&
            !data.judgmentDate
        ) {
            return "Please enter the judgment date.";
        }

        if (
            data.source === "gazette" &&
            !data.issuingAuthority
        ) {
            return "Please enter the issuing authority.";
        }

        if (
            data.source === "gazette" &&
            !data.gazetteDate
        ) {
            return "Please enter the notification date.";
        }

        if (
            data.source === "rbi" &&
            !data.rbiDate
        ) {
            return "Please enter the RBI publication date.";
        }

        if (
            data.source === "sebi" &&
            !data.sebiDate
        ) {
            return "Please enter the SEBI publication date.";
        }

        if (
            data.source === "pib" &&
            !data.pibDate
        ) {
            return "Please enter the PIB release date.";
        }

        return "";
    }

    /* =========================================================
       STANDARD INTERNATIONAL CITATIONS
    ========================================================= */

    function formatAPA(data) {
        const authors = apaAuthors(data.authors);

        if (data.source === "book") {
            return `${authors ? `${authors}. ` : ""}(${data.year}). ${italic(data.title)}.${data.publication ? ` ${escapeHtml(data.publication)}.` : ""}`;
        }

        if (data.source === "journal") {
            let result = `${authors ? `${authors}. ` : ""}(${data.year}). ${escapeHtml(data.title)}.`;

            if (data.publication) {
                result += ` ${italic(data.publication)}`;

                if (data.volume) {
                    result += `, ${data.volume}`;
                }

                if (data.issue) {
                    result += `(${data.issue})`;
                }

                if (data.pages) {
                    result += `, ${data.pages}`;
                }

                result += ".";
            }

            if (data.doi) {
                result += ` https://doi.org/${escapeHtml(data.doi)}`;
            } else if (data.url) {
                result += ` ${escapeHtml(data.url)}`;
            }

            return result;
        }

        let result = `${authors ? `${authors}. ` : ""}(${data.year}). ${escapeHtml(data.title)}.`;

        if (data.publication) {
            result += ` ${italic(data.publication)}.`;
        }

        if (data.url) {
            result += ` ${escapeHtml(data.url)}`;
        }

        return result;
    }

    function formatMLA(data) {
        const authors = mlaAuthors(data.authors);

        if (data.source === "book") {
            return `${authors ? `${authors}. ` : ""}${italic(data.title)}.${data.publication ? ` ${escapeHtml(data.publication)},` : ""} ${data.year}.`;
        }

        if (data.source === "journal") {
            let result = `${authors ? `${authors}. ` : ""}${quote(data.title)}.`;

            if (data.publication) {
                result += ` ${italic(data.publication)}`;
            }

            if (data.volume) {
                result += `, vol. ${escapeHtml(data.volume)}`;
            }

            if (data.issue) {
                result += `, no. ${escapeHtml(data.issue)}`;
            }

            if (data.year) {
                result += `, ${escapeHtml(data.year)}`;
            }

            if (data.pages) {
                result += `, pp. ${escapeHtml(data.pages)}`;
            }

            result += ".";

            if (data.url) {
                result += ` ${escapeHtml(data.url)}.`;
            }

            return result;
        }

        let result = `${authors ? `${authors}. ` : ""}${quote(data.title)}.`;

        if (data.publication) {
            result += ` ${italic(data.publication)},`;
        }

        if (data.year) {
            result += ` ${escapeHtml(data.year)}.`;
        }

        if (data.url) {
            result += ` ${escapeHtml(data.url)}.`;
        }

        return result;
    }

    function formatHarvard(data) {
        const authors = harvardAuthors(data.authors);

        let result = `${authors ? `${authors} ` : ""}(${data.year}) ${escapeHtml(data.title)}.`;

        if (data.publication) {
            result += ` ${italic(data.publication)}.`;
        }

        if (data.url) {
            result += ` Available at: ${escapeHtml(data.url)}.`;
        }

        return result;
    }

    function formatChicago(data) {
        const authors = chicagoAuthors(data.authors);

        let result = `${authors ? `${authors}. ` : ""}"${escapeHtml(data.title)}."`;

        if (data.publication) {
            result += ` ${italic(data.publication)}.`;
        }

        if (data.year) {
            result += ` ${escapeHtml(data.year)}.`;
        }

        if (data.url) {
            result += ` ${escapeHtml(data.url)}.`;
        }

        return result;
    }

    function formatIEEE(data) {
        const authors = ieeeAuthors(data.authors);

        let result = `${authors ? `${authors}, ` : ""}"${escapeHtml(data.title)},"`;

        if (data.publication) {
            result += ` ${italic(data.publication)}`;
        }

        if (data.volume) {
            result += `, vol. ${escapeHtml(data.volume)}`;
        }

        if (data.issue) {
            result += `, no. ${escapeHtml(data.issue)}`;
        }

        if (data.pages) {
            result += `, pp. ${escapeHtml(data.pages)}`;
        }

        if (data.year) {
            result += `, ${escapeHtml(data.year)}`;
        }

        result += ".";

        if (data.url) {
            result += ` [Online]. Available: ${escapeHtml(data.url)}`;
        }

        return result;
    }

    function formatVancouver(data) {
        const authors = vancouverAuthors(data.authors);

        let result = `${authors ? `${authors}. ` : ""}${escapeHtml(data.title)}.`;

        if (data.publication) {
            result += ` ${italic(data.publication)}.`;
        }

        if (data.year) {
            result += ` ${escapeHtml(data.year)}`;
        }

        if (data.volume) {
            result += `;${escapeHtml(data.volume)}`;
        }

        if (data.issue) {
            result += `(${escapeHtml(data.issue)})`;
        }

        if (data.pages) {
            result += `:${escapeHtml(data.pages)}`;
        }

        result += ".";

        return result;
    }

    /* =========================================================
       INDIA GOVERNMENT SOURCES
    ========================================================= */

    function formatGovernmentReport(data) {
        const organisation =
            data.organisation ||
            data.publication ||
            "Government of India";

        const date =
            formatDate(data.reportDate) ||
            data.year;

        let result = `${escapeHtml(organisation)}.`;

        if (date) {
            result += ` (${escapeHtml(date)}).`;
        }

        result += ` ${italic(data.title)}.`;

        if (data.reportNumber) {
            result += ` ${escapeHtml(data.reportNumber)}.`;
        }

        if (data.url) {
            result += ` ${escapeHtml(data.url)}`;
        }

        return result;
    }

    function formatGovernmentMinistry(data) {
        const ministry =
            data.ministry ||
            data.publication ||
            "Government of India";

        const date =
            formatDate(data.documentDate) ||
            data.year;

        let result = `${escapeHtml(ministry)}.`;

        if (date) {
            result += ` (${escapeHtml(date)}).`;
        }

        result += ` ${italic(data.title)}.`;

        if (data.documentNumber) {
            result += ` ${escapeHtml(data.documentNumber)}.`;
        }

        if (data.url) {
            result += ` ${escapeHtml(data.url)}`;
        }

        return result;
    }

    /* =========================================================
       INDIAN LEGAL CITATIONS
    ========================================================= */

    function formatIndianCase(data) {
        const caseName = escapeHtml(data.title);
        const court = escapeHtml(data.court);
        const date = formatDate(data.judgmentDate);

        let result = `${caseName}`;

        if (data.caseCitation) {
            result += `, ${escapeHtml(data.caseCitation)}`;
        }

        if (data.caseNumber) {
            result += `, ${escapeHtml(data.caseNumber)}`;
        }

        result += ` (${court}`;

        if (date) {
            result += `, ${escapeHtml(date)}`;
        }

        result += `)`;

        if (data.bench) {
            result += `, Bench: ${escapeHtml(data.bench)}`;
        }

        if (data.url) {
            result += `. ${escapeHtml(data.url)}`;
        } else {
            result += ".";
        }

        return result;
    }

    function formatIndianKanoon(data) {
        let result = formatIndianCase(data);

        if (data.style === "apa") {
            result = `${escapeHtml(data.title)}. (${escapeHtml(data.year || new Date(data.judgmentDate).getFullYear() || "")}). ${escapeHtml(data.court)}.`;

            if (data.caseCitation) {
                result += ` ${escapeHtml(data.caseCitation)}.`;
            }

            if (data.url) {
                result += ` ${escapeHtml(data.url)}`;
            }
        }

        return result;
    }

    function formatGazette(data) {
        const authority =
            data.issuingAuthority ||
            data.publication ||
            "Government of India";

        const date = formatDate(data.gazetteDate);

        let result = `${escapeHtml(authority)}.`;

        if (date) {
            result += ` (${escapeHtml(date)}).`;
        }

        result += ` ${italic(data.title)}.`;

        if (data.notificationNumber) {
            result += ` Notification No. ${escapeHtml(data.notificationNumber)}.`;
        }

        if (data.gazettePart) {
            result += ` ${escapeHtml(data.gazettePart)}.`;
        }

        if (data.url) {
            result += ` ${escapeHtml(data.url)}`;
        }

        return result;
    }

    function formatRBI(data) {
        const date =
            formatDate(data.rbiDate) ||
            data.year;

        let result = `Reserve Bank of India.`;

        if (date) {
            result += ` (${escapeHtml(date)}).`;
        }

        result += ` ${italic(data.title)}.`;

        if (data.rbiDocumentType) {
            result += ` ${escapeHtml(data.rbiDocumentType)}.`;
        }

        if (data.rbiNumber) {
            result += ` ${escapeHtml(data.rbiNumber)}.`;
        }

        if (data.url) {
            result += ` ${escapeHtml(data.url)}`;
        }

        return result;
    }

    function formatSEBI(data) {
        const date =
            formatDate(data.sebiDate) ||
            data.year;

        let result = `Securities and Exchange Board of India.`;

        if (date) {
            result += ` (${escapeHtml(date)}).`;
        }

        result += ` ${italic(data.title)}.`;

        if (data.sebiDocumentType) {
            result += ` ${escapeHtml(data.sebiDocumentType)}.`;
        }

        if (data.sebiNumber) {
            result += ` ${escapeHtml(data.sebiNumber)}.`;
        }

        if (data.url) {
            result += ` ${escapeHtml(data.url)}`;
        }

        return result;
    }

    function formatPIB(data) {
        const ministry =
            data.pibMinistry ||
            data.publication ||
            "Press Information Bureau";

        const date =
            formatDate(data.pibDate) ||
            data.year;

        let result = `${escapeHtml(ministry)}.`;

        if (date) {
            result += ` (${escapeHtml(date)}).`;
        }

        result += ` ${italic(data.title)}.`;

        if (data.pibReleaseNumber) {
            result += ` Press Release ${escapeHtml(data.pibReleaseNumber)}.`;
        }

        result += ` Press Information Bureau.`;

        if (data.url) {
            result += ` ${escapeHtml(data.url)}`;
        }

        return result;
    }

    function formatNewspaper(data) {
        const authors = harvardAuthors(data.authors);

        const date =
            formatDate(data.publicationDate) ||
            data.year;

        let result = `${authors ? `${authors}. ` : ""}${escapeHtml(data.title)}.`;

        if (data.publication) {
            result += ` ${italic(data.publication)}`;
        }

        if (data.edition) {
            result += `, ${escapeHtml(data.edition)}`;
        }

        if (date) {
            result += `, ${escapeHtml(date)}.`;
        }

        if (data.url) {
            result += ` ${escapeHtml(data.url)}`;
        }

        return result;
    }

    function formatLegislation(data) {
        let result = `${italic(data.title)}`;

        if (data.actNumber) {
            result += `, ${escapeHtml(data.actNumber)}`;
        }

        if (data.year) {
            result += ` (${escapeHtml(data.year)})`;
        }

        if (data.issuingAuthority) {
            result += `, ${escapeHtml(data.issuingAuthority)}`;
        }

        if (data.url) {
            result += `. ${escapeHtml(data.url)}`;
        } else {
            result += ".";
        }

        return result;
    }

    /* =========================================================
       MAIN FORMATTER
    ========================================================= */

    function generateCitation(data) {
        /*
         * India-specific sources get dedicated formatting.
         */
        if (data.context === "india") {
            switch (data.source) {
                case "government-report":
                    return formatGovernmentReport(data);

                case "government-ministry":
                    return formatGovernmentMinistry(data);

                case "indian-kanoon":
                    return formatIndianKanoon(data);

                case "supreme-court":
                    return formatIndianCase(data);

                case "high-court":
                    return formatIndianCase(data);

                case "gazette":
                    return formatGazette(data);

                case "rbi":
                    return formatRBI(data);

                case "sebi":
                    return formatSEBI(data);

                case "pib":
                    return formatPIB(data);

                case "newspaper":
                    return formatNewspaper(data);

                case "legislation":
                    return formatLegislation(data);
            }
        }

        /*
         * International standard sources.
         */
        switch (data.style) {
            case "mla":
                return formatMLA(data);

            case "harvard":
                return formatHarvard(data);

            case "chicago":
                return formatChicago(data);

            case "ieee":
                return formatIEEE(data);

            case "vancouver":
                return formatVancouver(data);

            case "apa":
            default:
                return formatAPA(data);
        }
    }

    /* =========================================================
       IN-TEXT CITATION
    ========================================================= */

    function generateInText(data) {
        const legalSources = [
            "indian-kanoon",
            "supreme-court",
            "high-court",
            "gazette",
            "rbi",
            "sebi",
            "pib",
            "government-report",
            "government-ministry",
            "legislation"
        ];

        if (legalSources.includes(data.source)) {
            if (data.source === "supreme-court") {
                return `(Supreme Court of India, ${data.year || "n.d."})`;
            }

            if (data.source === "high-court") {
                return `(${data.court || "High Court"}, ${data.year || "n.d."})`;
            }

            if (data.source === "rbi") {
                return `(Reserve Bank of India, ${data.year || "n.d."})`;
            }

            if (data.source === "sebi") {
                return `(SEBI, ${data.year || "n.d."})`;
            }

            if (data.source === "pib") {
                return `(${data.pibMinistry || "Press Information Bureau"}, ${data.year || "n.d."})`;
            }

            if (data.source === "government-report") {
                return `(${data.organisation || "Government of India"}, ${data.year || "n.d."})`;
            }

            if (data.source === "government-ministry") {
                return `(${data.ministry || "Government of India"}, ${data.year || "n.d."})`;
            }

            if (data.source === "gazette") {
                return `(${data.issuingAuthority || "Government of India"}, ${data.year || "n.d."})`;
            }

            if (data.source === "legislation") {
                return `(${data.title}, ${data.year || "n.d."})`;
            }

            return `(${getLastName(data.authors[0] || data.title)}, ${data.year || "n.d."})`;
        }

        if (!data.authors.length) {
            return `(${data.year || "n.d."})`;
        }

        if (data.authors.length === 1) {
            return `(${getLastName(data.authors[0])}, ${data.year || "n.d."})`;
        }

        if (data.authors.length === 2) {
            return `(${getLastName(data.authors[0])} & ${getLastName(data.authors[1])}, ${data.year || "n.d."})`;
        }

        return `(${getLastName(data.authors[0])} et al., ${data.year || "n.d."})`;
    }

    /* =========================================================
       UI EVENTS
    ========================================================= */

    document
        .querySelectorAll('input[name="citation-context"]')
        .forEach(radio => {
            radio.addEventListener("change", () => {
                updateSourceTypes();

                if (citationResult) {
                    citationResult.hidden = true;
                }

                if (formMessage) {
                    formMessage.textContent = "";
                }
            });
        });

    if (sourceType) {
        sourceType.addEventListener("change", () => {
            updateSourceFields();

            if (citationResult) {
                citationResult.hidden = true;
            }

            if (formMessage) {
                formMessage.textContent = "";
            }
        });
    }

    /* =========================================================
       GENERATE
    ========================================================= */

    if (generateBtn) {
        generateBtn.addEventListener("click", event => {
            event.preventDefault();

            const data = collectData();
            const error = validateData(data);

            if (error) {
                if (formMessage) {
                    formMessage.textContent = error;
                }

                if (citationResult) {
                    citationResult.hidden = true;
                }

                return;
            }

            if (formMessage) {
                formMessage.textContent = "";
            }

            const citation = generateCitation(data);
            const inText = generateInText(data);

            if (citationText) {
                citationText.innerHTML = citation;
            }

            if (inTextCitation) {
                inTextCitation.textContent = inText;
            }

            if (citationResult) {
                citationResult.hidden = false;

                setTimeout(() => {
                    citationResult.scrollIntoView({
                        behavior: "smooth",
                        block: "nearest"
                    });
                }, 50);
            }

            if (copyBtn) {
                copyBtn.textContent = "Copy Citation";
                copyBtn.classList.remove("copied");
            }
        });
    }

    /* =========================================================
       COPY
    ========================================================= */

    async function copyCitation() {
        if (!citationText) {
            return;
        }

        const text = citationText.innerText.trim();

        if (!text) {
            return;
        }

        try {
            await navigator.clipboard.writeText(text);
        } catch (error) {
            const textarea = document.createElement("textarea");

            textarea.value = text;
            textarea.style.position = "fixed";
            textarea.style.opacity = "0";

            document.body.appendChild(textarea);

            textarea.focus();
            textarea.select();

            document.execCommand("copy");

            textarea.remove();
        }

        if (copyBtn) {
            copyBtn.textContent = "Copied!";
            copyBtn.classList.add("copied");

            setTimeout(() => {
                copyBtn.textContent = "Copy Citation";
                copyBtn.classList.remove("copied");
            }, 1800);
        }
    }

    if (copyBtn) {
        copyBtn.addEventListener("click", event => {
            event.preventDefault();
            copyCitation();
        });
    }

    /* =========================================================
       ENTER KEY
    ========================================================= */

    document.querySelectorAll("input, textarea").forEach(input => {
        input.addEventListener("keydown", event => {
            if (
                event.key === "Enter" &&
                !event.shiftKey &&
                input.tagName !== "TEXTAREA"
            ) {
                event.preventDefault();

                if (generateBtn) {
                    generateBtn.click();
                }
            }
        });
    });

    /* =========================================================
       INITIAL LOAD
    ========================================================= */

    updateSourceTypes();
});
