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
       STATE
    ========================================================= */

    let sources = [];
    let editingSourceId = null;

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

        return /^https?:\/\//i.test(url)
            ? url
            : `https://${url}`;
    }

    function normalizeDoi(value) {
        let doi = clean(value);

        if (!doi) {
            return "";
        }

        return doi
            .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
            .replace(/^doi:\s*/i, "");
    }

    function parseAuthors(value) {
        return clean(value)
            .split(/\s*(?:;|\n)\s*/)
            .map(name => name.trim())
            .filter(Boolean);
    }

    function getLastName(name) {
        const parts = clean(name).split(/\s+/);
        return parts.length ? parts[parts.length - 1] : "";
    }

    function getInitials(name) {
        const parts = clean(name)
            .replace(/,/g, "")
            .split(/\s+/)
            .filter(Boolean);

        if (!parts.length) {
            return "";
        }

        const last = parts.pop();

        const initials = parts
            .map(part => `${part.charAt(0).toUpperCase()}.`)
            .join(" ");

        return initials
            ? `${last}, ${initials}`
            : last;
    }

    function apaAuthors(authors) {
        if (!authors.length) return "";

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
        if (!authors.length) return "";

        if (authors.length === 1) {
            return authors[0];
        }

        if (authors.length === 2) {
            return `${authors[0]}, and ${authors[1]}`;
        }

        return `${authors[0]}, et al.`;
    }

    function harvardAuthors(authors) {
        return authors.map(getInitials).join(", ");
    }

    function chicagoAuthors(authors) {
        return authors.join(", ");
    }

    function ieeeAuthors(authors) {
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
        if (!value) return "";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    }

    function fieldValue(id) {
        const field = document.getElementById(id);
        return field ? clean(field.value) : "";
    }

    /* =========================================================
       SOURCE LIST
    ========================================================= */

    const internationalSources = [
        ["website", "Website"],
        ["book", "Book"],
        ["journal", "Journal Article"]
    ];

    const indiaSources = [
        ["website", "Website"],
        ["book", "Book"],
        ["journal", "Journal Article"],
        ["government-report", "Government Report"],
        ["government-ministry", "Government Ministry"],
        ["indian-kanoon", "Indian Kanoon"],
        ["supreme-court", "Supreme Court of India"],
        ["high-court", "High Court of India"],
        ["gazette", "Gazette Notification"],
        ["rbi", "RBI Publication"],
        ["sebi", "SEBI Publication"],
        ["pib", "PIB Press Release"],
        ["newspaper", "Newspaper Article"],
        ["legislation", "Act / Legislation"]
    ];

    function updateSourceTypes() {
        if (!sourceType) return;

        const context = getSelectedContext();

        const list =
            context === "india"
                ? indiaSources
                : internationalSources;

        const current = sourceType.value;

        sourceType.innerHTML = "";

        list.forEach(([value, label]) => {
            const option = document.createElement("option");

            option.value = value;
            option.textContent = label;

            sourceType.appendChild(option);
        });

        if (list.some(item => item[0] === current)) {
            sourceType.value = current;
        } else {
            sourceType.value = list[0][0];
        }

        updateDynamicFields();
    }

    /* =========================================================
       DYNAMIC FIELDS
    ========================================================= */

    let dynamicContainer =
        document.getElementById("dynamic-fields-container");

    if (!dynamicContainer) {
        dynamicContainer = document.createElement("div");
        dynamicContainer.id = "dynamic-fields-container";

        const doiGroup =
            doiInput?.closest(".form-group") ||
            doiInput?.parentElement;

        if (doiGroup && doiGroup.parentNode) {
            doiGroup.parentNode.insertBefore(
                dynamicContainer,
                doiGroup.nextSibling
            );
        }
    }

    function createDynamicField(
        id,
        label,
        type = "text",
        placeholder = ""
    ) {
        const wrapper = document.createElement("div");

        wrapper.className = "form-group dynamic-field";

        const labelElement = document.createElement("label");

        labelElement.htmlFor = id;
        labelElement.textContent = label;

        wrapper.appendChild(labelElement);

        const input = document.createElement("input");

        input.id = id;
        input.type = type;
        input.placeholder = placeholder;

        wrapper.appendChild(input);

        return wrapper;
    }

    function addDynamicField(
        id,
        label,
        type = "text",
        placeholder = ""
    ) {
        dynamicContainer.appendChild(
            createDynamicField(
                id,
                label,
                type,
                placeholder
            )
        );
    }

    function updateDynamicFields() {
        if (!dynamicContainer) return;

        dynamicContainer.innerHTML = "";

        const context = getSelectedContext();
        const source = sourceType?.value;

        if (
            context === "international" &&
            source === "website"
        ) {
            addDynamicField(
                "access-date",
                "Access Date",
                "date"
            );
        }

        if (
            context === "international" &&
            source === "journal"
        ) {
            addDynamicField(
                "volume",
                "Volume",
                "text",
                "e.g. 12"
            );

            addDynamicField(
                "issue",
                "Issue",
                "text",
                "e.g. 3"
            );

            addDynamicField(
                "pages",
                "Pages",
                "text",
                "e.g. 145–162"
            );
        }

        if (source === "government-report") {
            addDynamicField(
                "organisation",
                "Ministry / Department / Organisation",
                "text",
                "e.g. Ministry of Finance"
            );

            addDynamicField(
                "report-number",
                "Report Number",
                "text",
                "e.g. Report No. 12/2026"
            );

            addDynamicField(
                "report-date",
                "Report Date",
                "date"
            );
        }

        if (source === "government-ministry") {
            addDynamicField(
                "ministry",
                "Ministry / Department",
                "text",
                "e.g. Ministry of Electronics and IT"
            );

            addDynamicField(
                "document-number",
                "Document / Notification Number",
                "text",
                "Optional"
            );

            addDynamicField(
                "document-date",
                "Publication Date",
                "date"
            );
        }

        if (
            source === "indian-kanoon" ||
            source === "supreme-court" ||
            source === "high-court"
        ) {
            addDynamicField(
                "court",
                source === "high-court"
                    ? "High Court"
                    : "Court",
                "text",
                source === "supreme-court"
                    ? "Supreme Court of India"
                    : "e.g. Bombay High Court"
            );

            addDynamicField(
                "case-number",
                "Case / Appeal Number",
                "text",
                "e.g. Civil Appeal No. 1234 of 2026"
            );

            addDynamicField(
                "judgment-date",
                "Judgment Date",
                "date"
            );

            addDynamicField(
                "case-citation",
                "Law Report / Citation",
                "text",
                "e.g. (2026) 5 SCC 123"
            );

            addDynamicField(
                "bench",
                "Judge(s) / Bench",
                "text",
                "e.g. D.Y. Chandrachud, J."
            );
        }

        if (source === "gazette") {
            addDynamicField(
                "issuing-authority",
                "Issuing Authority",
                "text",
                "e.g. Ministry of Finance"
            );

            addDynamicField(
                "notification-number",
                "Notification Number",
                "text",
                "e.g. S.O. 1234(E)"
            );

            addDynamicField(
                "gazette-date",
                "Notification Date",
                "date"
            );

            addDynamicField(
                "gazette-part",
                "Gazette Part / Section",
                "text",
                "Optional"
            );
        }

        if (source === "rbi") {
            addDynamicField(
                "rbi-document-type",
                "RBI Document Type",
                "text",
                "e.g. Circular, Notification, Report"
            );

            addDynamicField(
                "rbi-number",
                "Notification / Circular Number",
                "text",
                "e.g. RBI/2026-27/45"
            );

            addDynamicField(
                "rbi-date",
                "Publication Date",
                "date"
            );
        }

        if (source === "sebi") {
            addDynamicField(
                "sebi-document-type",
                "SEBI Document Type",
                "text",
                "e.g. Circular, Regulation, Report"
            );

            addDynamicField(
                "sebi-number",
                "Circular / Reference Number",
                "text",
                "e.g. SEBI/HO/..."
            );

            addDynamicField(
                "sebi-date",
                "Publication Date",
                "date"
            );
        }

        if (source === "pib") {
            addDynamicField(
                "pib-ministry",
                "Ministry / Department",
                "text",
                "e.g. Ministry of Finance"
            );

            addDynamicField(
                "pib-release-number",
                "Press Release Number",
                "text",
                "e.g. PIB/2026/123"
            );

            addDynamicField(
                "pib-date",
                "Release Date",
                "date"
            );
        }

        if (source === "newspaper") {
            addDynamicField(
                "edition",
                "Edition / City",
                "text",
                "e.g. Mumbai"
            );

            addDynamicField(
                "publication-date",
                "Publication Date",
                "date"
            );
        }

        if (source === "legislation") {
            addDynamicField(
                "act-number",
                "Act Number",
                "text",
                "e.g. Act No. 21 of 2026"
            );

            addDynamicField(
                "issuing-authority",
                "Issuing Authority",
                "text",
                "e.g. Parliament of India"
            );

            addDynamicField(
                "act-date",
                "Date",
                "date"
            );
        }
    }

    /* =========================================================
       COLLECT CURRENT SOURCE
    ========================================================= */

    function collectCurrentSource() {
        return {
            id: editingSourceId || Date.now(),

            context: getSelectedContext(),

            style: citationStyle?.value || "apa",

            source: sourceType?.value || "website",

            author: clean(authorInput?.value),

            authors: parseAuthors(
                authorInput?.value
            ),

            year: clean(yearInput?.value),

            title: clean(titleInput?.value),

            publication: clean(
                publicationInput?.value
            ),

            url: normalizeUrl(
                urlInput?.value
            ),

            doi: normalizeDoi(
                doiInput?.value
            ),

            accessDate: fieldValue(
                "access-date"
            ),

            volume: fieldValue("volume"),

            issue: fieldValue("issue"),

            pages: fieldValue("pages"),

            organisation: fieldValue(
                "organisation"
            ),

            reportNumber: fieldValue(
                "report-number"
            ),

            reportDate: fieldValue(
                "report-date"
            ),

            ministry: fieldValue(
                "ministry"
            ),

            documentNumber: fieldValue(
                "document-number"
            ),

            documentDate: fieldValue(
                "document-date"
            ),

            court: fieldValue("court"),

            caseNumber: fieldValue(
                "case-number"
            ),

            judgmentDate: fieldValue(
                "judgment-date"
            ),

            caseCitation: fieldValue(
                "case-citation"
            ),

            bench: fieldValue("bench"),

            issuingAuthority: fieldValue(
                "issuing-authority"
            ),

            notificationNumber: fieldValue(
                "notification-number"
            ),

            gazetteDate: fieldValue(
                "gazette-date"
            ),

            gazettePart: fieldValue(
                "gazette-part"
            ),

            rbiDocumentType: fieldValue(
                "rbi-document-type"
            ),

            rbiNumber: fieldValue(
                "rbi-number"
            ),

            rbiDate: fieldValue(
                "rbi-date"
            ),

            sebiDocumentType: fieldValue(
                "sebi-document-type"
            ),

            sebiNumber: fieldValue(
                "sebi-number"
            ),

            sebiDate: fieldValue(
                "sebi-date"
            ),

            pibMinistry: fieldValue(
                "pib-ministry"
            ),

            pibReleaseNumber: fieldValue(
                "pib-release-number"
            ),

            pibDate: fieldValue(
                "pib-date"
            ),

            edition: fieldValue("edition"),

            publicationDate: fieldValue(
                "publication-date"
            ),

            actNumber: fieldValue(
                "act-number"
            ),

            actDate: fieldValue(
                "act-date"
            )
        };
    }

    /* =========================================================
       LOAD SOURCE INTO FORM
    ========================================================= */

    function setValue(element, value) {
        if (element) {
            element.value = value || "";
        }
    }

    function loadSource(source) {
        if (!source) return;

        const radio = document.querySelector(
            `input[name="citation-context"][value="${source.context}"]`
        );

        if (radio) {
            radio.checked = true;
        }

        updateSourceTypes();

        if (sourceType) {
            sourceType.value = source.source;
        }

        updateDynamicFields();

        if (citationStyle) {
            citationStyle.value = source.style;
        }

        setValue(
            authorInput,
            source.author
        );

        setValue(
            yearInput,
            source.year
        );

        setValue(
            titleInput,
            source.title
        );

        setValue(
            publicationInput,
            source.publication
        );

        setValue(
            urlInput,
            source.url
        );

        setValue(
            doiInput,
            source.doi
        );

        Object.keys(source).forEach(key => {
            const field = document.getElementById(
                key.replace(
                    /[A-Z]/g,
                    letter => `-${letter.toLowerCase()}`
                )
            );

            if (
                field &&
                ![
                    "author",
                    "year",
                    "title",
                    "publication",
                    "url",
                    "doi"
                ].includes(key)
            ) {
                field.value =
                    source[key] || "";
            }
        });
    }

    /* =========================================================
       VALIDATION
    ========================================================= */

    function validateSource(data) {
        if (!data.title) {
            return "Please enter the title.";
        }

        const noAuthorRequired = [
            "legislation",
            "supreme-court",
            "high-court",
            "indian-kanoon",
            "gazette",
            "rbi",
            "sebi",
            "pib",
            "government-report",
            "government-ministry"
        ];

        if (
            !noAuthorRequired.includes(
                data.source
            ) &&
            !data.author
        ) {
            return "Please enter the author / writer.";
        }

        return "";
    }

    /* =========================================================
       INTERNATIONAL FORMATS
    ========================================================= */

    function formatAPA(data) {
        const authors = apaAuthors(
            data.authors
        );

        if (data.source === "book") {
            return `${authors ? `${authors}. ` : ""}(${escapeHtml(data.year)}). ${italic(data.title)}.${data.publication ? ` ${escapeHtml(data.publication)}.` : ""}`;
        }

        if (data.source === "journal") {
            let result =
                `${authors ? `${authors}. ` : ""}(${escapeHtml(data.year)}). ${escapeHtml(data.title)}.`;

            if (data.publication) {
                result += ` ${italic(data.publication)}`;

                if (data.volume) {
                    result += `, ${escapeHtml(data.volume)}`;
                }

                if (data.issue) {
                    result += `(${escapeHtml(data.issue)})`;
                }

                if (data.pages) {
                    result += `, ${escapeHtml(data.pages)}`;
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

        let result =
            `${authors ? `${authors}. ` : ""}(${escapeHtml(data.year)}). ${escapeHtml(data.title)}.`;

        if (data.publication) {
            result += ` ${italic(data.publication)}.`;
        }

        if (data.url) {
            result += ` ${escapeHtml(data.url)}`;
        }

        return result;
    }

    function formatMLA(data) {
        const authors = mlaAuthors(
            data.authors
        );

        if (data.source === "book") {
            return `${authors ? `${authors}. ` : ""}${italic(data.title)}.${data.publication ? ` ${escapeHtml(data.publication)},` : ""} ${escapeHtml(data.year)}.`;
        }

        if (data.source === "journal") {
            let result =
                `${authors ? `${authors}. ` : ""}${quote(data.title)}.`;

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

        let result =
            `${authors ? `${authors}. ` : ""}${quote(data.title)}.`;

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
        const authors =
            harvardAuthors(data.authors);

        let result =
            `${authors ? `${authors} ` : ""}(${escapeHtml(data.year)}) ${escapeHtml(data.title)}.`;

        if (data.publication) {
            result += ` ${italic(data.publication)}.`;
        }

        if (data.url) {
            result += ` Available at: ${escapeHtml(data.url)}`;
        }

        return result;
    }

    function formatChicago(data) {
        const authors =
            chicagoAuthors(data.authors);

        let result =
            `${authors ? `${authors}. ` : ""}${escapeHtml(data.title)}.`;

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
        const authors =
            ieeeAuthors(data.authors);

        let result =
            `${authors ? `${authors}, ` : ""}"${escapeHtml(data.title)},"`;

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
        const authors =
            vancouverAuthors(data.authors);

        let result =
            `${authors ? `${authors}. ` : ""}${escapeHtml(data.title)}.`;

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
       INDIA FORMATS
    ========================================================= */

    function formatGovernmentReport(data) {
        let result =
            `${escapeHtml(data.organisation || "Government of India")}.`;

        if (data.reportDate || data.year) {
            result += ` (${escapeHtml(
                formatDate(data.reportDate) ||
                data.year
            )}).`;
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
        let result =
            `${escapeHtml(data.ministry || "Government of India")}.`;

        if (data.documentDate || data.year) {
            result += ` (${escapeHtml(
                formatDate(data.documentDate) ||
                data.year
            )}).`;
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

    function formatIndianCase(data) {
        let result =
            `${escapeHtml(data.title)}`;

        if (data.caseCitation) {
            result += `, ${escapeHtml(data.caseCitation)}`;
        }

        if (data.caseNumber) {
            result += `, ${escapeHtml(data.caseNumber)}`;
        }

        result += ` (${escapeHtml(
            data.court || "Indian Court"
        )}`;

        if (data.judgmentDate) {
            result += `, ${escapeHtml(
                formatDate(data.judgmentDate)
            )}`;
        }

        result += ")";

        if (data.bench) {
            result += `, Bench: ${escapeHtml(
                data.bench
            )}`;
        }

        if (data.url) {
            result += `. ${escapeHtml(data.url)}`;
        } else {
            result += ".";
        }

        return result;
    }

    function formatGazette(data) {
        let result =
            `${escapeHtml(
                data.issuingAuthority ||
                "Government of India"
            )}.`;

        if (data.gazetteDate) {
            result += ` (${escapeHtml(
                formatDate(data.gazetteDate)
            )}).`;
        }

        result += ` ${italic(data.title)}.`;

        if (data.notificationNumber) {
            result += ` Notification No. ${escapeHtml(
                data.notificationNumber
            )}.`;
        }

        if (data.gazettePart) {
            result += ` ${escapeHtml(
                data.gazettePart
            )}.`;
        }

        if (data.url) {
            result += ` ${escapeHtml(data.url)}`;
        }

        return result;
    }

    function formatRBI(data) {
        let result =
            "Reserve Bank of India.";

        if (data.rbiDate || data.year) {
            result += ` (${escapeHtml(
                formatDate(data.rbiDate) ||
                data.year
            )}).`;
        }

        result += ` ${italic(data.title)}.`;

        if (data.rbiDocumentType) {
            result += ` ${escapeHtml(
                data.rbiDocumentType
            )}.`;
        }

        if (data.rbiNumber) {
            result += ` ${escapeHtml(
                data.rbiNumber
            )}.`;
        }

        if (data.url) {
            result += ` ${escapeHtml(data.url)}`;
        }

        return result;
    }

    function formatSEBI(data) {
        let result =
            "Securities and Exchange Board of India.";

        if (data.sebiDate || data.year) {
            result += ` (${escapeHtml(
                formatDate(data.sebiDate) ||
                data.year
            )}).`;
        }

        result += ` ${italic(data.title)}.`;

        if (data.sebiDocumentType) {
            result += ` ${escapeHtml(
                data.sebiDocumentType
            )}.`;
        }

        if (data.sebiNumber) {
            result += ` ${escapeHtml(
                data.sebiNumber
            )}.`;
        }

        if (data.url) {
            result += ` ${escapeHtml(data.url)}`;
        }

        return result;
    }

    function formatPIB(data) {
        let result =
            `${escapeHtml(
                data.pibMinistry ||
                "Press Information Bureau"
            )}.`;

        if (data.pibDate || data.year) {
            result += ` (${escapeHtml(
                formatDate(data.pibDate) ||
                data.year
            )}).`;
        }

        result += ` ${italic(data.title)}.`;

        if (data.pibReleaseNumber) {
            result += ` Press Release ${escapeHtml(
                data.pibReleaseNumber
            )}.`;
        }

        result += " Press Information Bureau.";

        if (data.url) {
            result += ` ${escapeHtml(data.url)}`;
        }

        return result;
    }

    function formatNewspaper(data) {
        const authors =
            harvardAuthors(data.authors);

        let result =
            `${authors ? `${authors}. ` : ""}${escapeHtml(data.title)}.`;

        if (data.publication) {
            result += ` ${italic(data.publication)}`;
        }

        if (data.edition) {
            result += `, ${escapeHtml(
                data.edition
            )}`;
        }

        if (
            data.publicationDate ||
            data.year
        ) {
            result += `, ${escapeHtml(
                formatDate(data.publicationDate) ||
                data.year
            )}.`;
        }

        if (data.url) {
            result += ` ${escapeHtml(data.url)}`;
        }

        return result;
    }

    function formatLegislation(data) {
        let result =
            `${italic(data.title)}`;

        if (data.actNumber) {
            result += `, ${escapeHtml(
                data.actNumber
            )}`;
        }

        if (data.year) {
            result += ` (${escapeHtml(
                data.year
            )})`;
        }

        if (data.issuingAuthority) {
            result += `, ${escapeHtml(
                data.issuingAuthority
            )}`;
        }

        if (data.url) {
            result += `. ${escapeHtml(data.url)}`;
        } else {
            result += ".";
        }

        return result;
    }

    /* =========================================================
       STYLE-AWARE INDIA FORMAT
    ========================================================= */

    function formatIndiaByStyle(data) {
        const style =
            data.style || "apa";

        if (
            data.source === "indian-kanoon" ||
            data.source === "supreme-court" ||
            data.source === "high-court"
        ) {
            if (style === "mla") {
                let result =
                    `${escapeHtml(data.title)}.`;

                if (data.court) {
                    result += ` ${escapeHtml(data.court)}.`;
                }

                if (data.caseCitation) {
                    result += ` ${escapeHtml(
                        data.caseCitation
                    )}.`;
                }

                if (data.judgmentDate) {
                    result += ` ${escapeHtml(
                        formatDate(data.judgmentDate)
                    )}.`;
                }

                if (data.url) {
                    result += ` ${escapeHtml(data.url)}.`;
                }

                return result;
            }

            if (style === "ieee") {
                let result =
                    `"${escapeHtml(data.title)},"`;

                if (data.court) {
                    result += ` ${escapeHtml(
                        data.court
                    )}`;
                }

                if (data.caseCitation) {
                    result += `, ${escapeHtml(
                        data.caseCitation
                    )}`;
                }

                if (data.judgmentDate) {
                    result += `, ${escapeHtml(
                        formatDate(data.judgmentDate)
                    )}`;
                }

                result += ".";

                if (data.url) {
                    result += ` [Online]. Available: ${escapeHtml(
                        data.url
                    )}`;
                }

                return result;
            }

            if (style === "vancouver") {
                let result =
                    `${escapeHtml(data.title)}.`;

                if (data.court) {
                    result += ` ${escapeHtml(
                        data.court
                    )}`;
                }

                if (data.judgmentDate) {
                    result += ` ${escapeHtml(
                        formatDate(data.judgmentDate)
                    )}`;
                }

                if (data.caseCitation) {
                    result += `. ${escapeHtml(
                        data.caseCitation
                    )}`;
                }

                result += ".";

                return result;
            }

            if (style === "chicago") {
                return `${escapeHtml(data.title)}. ${data.court ? `${escapeHtml(data.court)}. ` : ""}${data.caseCitation ? `${escapeHtml(data.caseCitation)}. ` : ""}${data.judgmentDate ? `${escapeHtml(formatDate(data.judgmentDate))}.` : ""}`;
            }

            if (style === "harvard") {
                return `${escapeHtml(data.title)} (${escapeHtml(data.year || "n.d.")}) ${data.court ? `${escapeHtml(data.court)}. ` : ""}${data.caseCitation ? `${escapeHtml(data.caseCitation)}. ` : ""}${data.url ? `Available at: ${escapeHtml(data.url)}` : ""}`;
            }

            return formatIndianCase(data);
        }

        if (data.source === "government-report") {
            return formatGovernmentReport(data);
        }

        if (data.source === "government-ministry") {
            return formatGovernmentMinistry(data);
        }

        if (data.source === "gazette") {
            return formatGazette(data);
        }

        if (data.source === "rbi") {
            return formatRBI(data);
        }

        if (data.source === "sebi") {
            return formatSEBI(data);
        }

        if (data.source === "pib") {
            return formatPIB(data);
        }

        if (data.source === "newspaper") {
            return formatNewspaper(data);
        }

        if (data.source === "legislation") {
            return formatLegislation(data);
        }

        return null;
    }

    /* =========================================================
       FINAL FORMATTER
    ========================================================= */

    function formatCitation(data, number = null) {
        let citation;

        if (data.context === "india") {
            citation =
                formatIndiaByStyle(data);
        }

        if (!citation) {
            switch (data.style) {
                case "mla":
                    citation = formatMLA(data);
                    break;

                case "harvard":
                    citation = formatHarvard(data);
                    break;

                case "chicago":
                    citation = formatChicago(data);
                    break;

                case "ieee":
                    citation = formatIEEE(data);
                    break;

                case "vancouver":
                    citation = formatVancouver(data);
                    break;

                case "apa":
                default:
                    citation = formatAPA(data);
                    break;
            }
        }

        if (
            number &&
            (
                data.style === "ieee" ||
                data.style === "vancouver"
            )
        ) {
            return `[${number}] ${citation}`;
        }

        return citation;
    }

    /* =========================================================
       MULTIPLE SOURCE IN-TEXT CITATIONS
    ========================================================= */

    function shortAuthor(data) {
        if (
            [
                "government-report",
                "government-ministry"
            ].includes(data.source)
        ) {
            return (
                data.organisation ||
                data.ministry ||
                "Government of India"
            );
        }

        if (data.source === "rbi") {
            return "Reserve Bank of India";
        }

        if (data.source === "sebi") {
            return "SEBI";
        }

        if (data.source === "pib") {
            return (
                data.pibMinistry ||
                "Press Information Bureau"
            );
        }

        if (
            data.source === "supreme-court"
        ) {
            return "Supreme Court of India";
        }

        if (
            data.source === "high-court"
        ) {
            return data.court || "High Court";
        }

        if (
            data.source === "indian-kanoon"
        ) {
            return (
                data.authors[0]
                    ? getLastName(data.authors[0])
                    : data.title
            );
        }

        return data.authors.length
            ? getLastName(data.authors[0])
            : data.title;
    }

    function generateCombinedInText(list) {
        if (!list.length) {
            return "";
        }

        const style =
            list[0].style || "apa";

        const entries = list.map(data => {
            const author =
                shortAuthor(data);

            const year =
                data.year ||
                (
                    data.judgmentDate
                        ? new Date(
                              data.judgmentDate
                          ).getFullYear()
                        : "n.d."
                );

            if (style === "mla") {
                return data.authors.length > 1
                    ? `${author} et al.`
                    : author;
            }

            if (style === "ieee") {
                return null;
            }

            if (style === "vancouver") {
                return null;
            }

            if (style === "harvard") {
                return `${author} ${year}`;
            }

            if (style === "chicago") {
                return `${author} ${year}`;
            }

            return `${author}, ${year}`;
        }).filter(Boolean);

        if (
            style === "ieee" ||
            style === "vancouver"
        ) {
            const numbers =
                list.map(
                    (_, index) => index + 1
                );

            return style === "ieee"
                ? `[${numbers.join(", ")}]`
                : `(${numbers.join(", ")})`;
        }

        return `(${entries.join("; ")})`;
    }

    /* =========================================================
       SOURCE VERIFICATION
       Client-side validation + DOI metadata verification.
       No citation data is changed by verification.
    ========================================================= */

    function getExpectedDomains(data) {
        const source = data.source;
        const context = data.context;

        if (context === "india") {
            const domains = {
                "indian-kanoon": ["indiankanoon.org"],
                "supreme-court": ["sci.gov.in", "main.sci.gov.in"],
                "rbi": ["rbi.org.in"],
                "sebi": ["sebi.gov.in", "sebi.gov.in"],
                "pib": ["pib.gov.in"],
                "legislation": ["indiacode.nic.in", "egazette.nic.in", "egazette.gov.in"],
                "government-report": [".gov.in", ".nic.in"],
                "government-ministry": [".gov.in", ".nic.in"],
                "gazette": ["egazette.nic.in", "egazette.gov.in", ".gov.in"],
                "high-court": [".gov.in", "hcservices.ecourts.gov.in"]
            };

            return domains[source] || [];
        }

        return [];
    }

    function hostMatches(host, expected) {
        const normalized = host.toLowerCase().replace(/^www\./, "");

        return expected.some(domain => {
            const d = domain.toLowerCase().replace(/^www\./, "");

            if (d.startsWith(".")) {
                return normalized.endsWith(d);
            }

            return normalized === d || normalized.endsWith(`.${d}`);
        });
    }

    function titlesRoughlyMatch(a, b) {
        const normalize = value =>
            clean(value)
                .toLowerCase()
                .replace(/[^\p{L}\p{N}]+/gu, " ")
                .replace(/\s+/g, " ")
                .trim();

        const first = normalize(a);
        const second = normalize(b);

        if (!first || !second) return false;
        if (first === second) return true;

        const shorter =
            first.length <= second.length ? first : second;
        const longer =
            first.length > second.length ? first : second;

        return shorter.length >= 12 && longer.includes(shorter);
    }

    async function verifyDOI(data) {
        const doi = normalizeDoi(data.doi);

        if (!doi) {
            return {
                level: "warning",
                title: "No DOI provided",
                message: "Add a DOI to verify the publication metadata."
            };
        }

        try {
            const response = await fetch(
                `https://api.crossref.org/works/${encodeURIComponent(doi)}`,
                {
                    method: "GET",
                    headers: {
                        "Accept": "application/json"
                    }
                }
            );

            if (!response.ok) {
                return {
                    level: "error",
                    title: "DOI not found",
                    message: `Crossref could not find this DOI (${response.status}).`
                };
            }

            const json = await response.json();
            const item = json?.message || {};

            const crossrefTitle =
                Array.isArray(item.title) && item.title.length
                    ? item.title[0]
                    : "";

            const crossrefAuthors =
                Array.isArray(item.author)
                    ? item.author
                        .map(author =>
                            `${author.given || ""} ${author.family || ""}`.trim()
                        )
                        .filter(Boolean)
                    : [];

            const titleMatch = data.title
                ? titlesRoughlyMatch(data.title, crossrefTitle)
                : true;

            const authorMatch =
                !data.authors.length ||
                data.authors.some(userAuthor => {
                    const lastName =
                        getLastName(userAuthor).toLowerCase();

                    return crossrefAuthors.some(crossrefAuthor =>
                        crossrefAuthor
                            .toLowerCase()
                            .includes(lastName)
                    );
                });

            if (!titleMatch || !authorMatch) {
                return {
                    level: "warning",
                    title: "DOI found, but details need review",
                    message:
                        `Crossref found the DOI. ` +
                        `${titleMatch ? "Title matches." : "Title does not closely match."} ` +
                        `${authorMatch ? "Author appears to match." : "Author could not be matched."}`,
                    metadata: {
                        title: crossrefTitle,
                        authors: crossrefAuthors,
                        year:
                            item.published?.["date-parts"]?.[0]?.[0] ||
                            item.issued?.["date-parts"]?.[0]?.[0] ||
                            ""
                    }
                };
            }

            return {
                level: "success",
                title: "Source verified",
                message: "DOI exists in Crossref and the supplied title/author details match.",
                metadata: {
                    title: crossrefTitle,
                    authors: crossrefAuthors,
                    year:
                        item.published?.["date-parts"]?.[0]?.[0] ||
                        item.issued?.["date-parts"]?.[0]?.[0] ||
                        ""
                }
            };
        } catch (error) {
            return {
                level: "warning",
                title: "DOI verification unavailable",
                message:
                    "Crossref could not be reached from the browser. The citation was not marked as verified."
            };
        }
    }

    async function verifySource(data) {
        const url = normalizeUrl(data.url);

        if (!url && !data.doi) {
            return {
                level: "warning",
                title: "Nothing to verify",
                message: "Add a valid source URL or DOI first."
            };
        }

        if (data.doi) {
            return await verifyDOI(data);
        }

        let parsedUrl;

        try {
            parsedUrl = new URL(url);
        } catch (error) {
            return {
                level: "error",
                title: "Invalid URL",
                message: "Please enter a complete and valid source URL."
            };
        }

        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
            return {
                level: "error",
                title: "Invalid URL",
                message: "Only HTTP and HTTPS source URLs can be verified."
            };
        }

        const expectedDomains = getExpectedDomains(data);

        if (expectedDomains.length) {
            const officialDomain = hostMatches(
                parsedUrl.hostname,
                expectedDomains
            );

            if (!officialDomain) {
                return {
                    level: "warning",
                    title: "Official-domain check failed",
                    message:
                        `This URL does not appear to use the expected official domain for ${data.source}. ` +
                        "Review the source before using the citation."
                };
            }

            return {
                level: "success",
                title: "Official domain verified",
                message:
                    `The URL uses an expected official domain (${parsedUrl.hostname}). ` +
                    "Page content was not independently verified."
            };
        }

        try {
            const response = await fetch(url, {
                method: "HEAD",
                mode: "cors"
            });

            if (response.ok) {
                return {
                    level: "success",
                    title: "Source URL reachable",
                    message:
                        `The source URL responded successfully (${response.status}).`
                };
            }

            return {
                level: "warning",
                title: "URL needs review",
                message:
                    `The source URL responded with status ${response.status}.`
            };
        } catch (error) {
            return {
                level: "warning",
                title: "URL could not be independently checked",
                message:
                    "The site may block browser verification (CORS or access restrictions). " +
                    "The URL format is valid, but SinSigma could not confirm the page."
            };
        }
    }

    function ensureVerificationStyles() {
        if (document.getElementById("verification-inline-styles")) return;

        const style = document.createElement("style");
        style.id = "verification-inline-styles";
        style.textContent = `
            .verify-source-btn {
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 13px 20px;
                margin-top: 10px;
                background: #fff;
                color: #111;
                border: 1px solid #111;
                border-radius: 8px;
                font-size: 15px;
                font-weight: 600;
                cursor: pointer;
                transition: all .2s ease;
            }

            .verify-source-btn:hover {
                background: #f7f7f7;
                transform: translateY(-1px);
            }

            .verify-source-btn:disabled {
                opacity: .65;
                cursor: wait;
                transform: none;
            }

            .verification-result {
                margin-top: 12px;
                padding: 12px 14px;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                font-size: 13px;
                line-height: 1.5;
                background: #fafafa;
            }

            .verification-result.success {
                border-color: #c7ead2;
                background: #f4fbf6;
            }

            .verification-result.warning {
                border-color: #f0dfad;
                background: #fffaf0;
            }

            .verification-result.error {
                border-color: #efcaca;
                background: #fff6f6;
            }

            .verification-result strong {
                display: block;
                margin-bottom: 3px;
                font-size: 14px;
            }

            .source-verify-mini {
                border: 0;
                background: transparent;
                text-decoration: underline;
                cursor: pointer;
                font-weight: 600;
                padding: 4px;
            }
        `;

        document.head.appendChild(style);
    }

    function showVerificationResult(result, target) {
        if (!target) return;

        target.className =
            `verification-result ${result.level || "warning"}`;

        target.innerHTML =
            `<strong>${escapeHtml(result.title || "Verification result")}</strong>` +
            `<span>${escapeHtml(result.message || "")}</span>`;

        if (result.metadata) {
            const details = [];

            if (result.metadata.title) {
                details.push(
                    `Crossref title: ${result.metadata.title}`
                );
            }

            if (result.metadata.year) {
                details.push(
                    `Year: ${result.metadata.year}`
                );
            }

            if (details.length) {
                target.innerHTML +=
                    `<div style="margin-top:6px;">${escapeHtml(details.join(" • "))}</div>`;
            }
        }
    }

    function createCurrentVerifyUI() {
        if (!generateBtn || document.getElementById("verify-source-btn")) {
            return;
        }

        ensureVerificationStyles();

        const verifyButton =
            document.createElement("button");

        verifyButton.type = "button";
        verifyButton.id = "verify-source-btn";
        verifyButton.className = "verify-source-btn";
        verifyButton.textContent = "Verify Source";

        const result =
            document.createElement("div");

        result.id = "verification-result";
        result.className = "verification-result";
        result.hidden = true;

        generateBtn.parentNode.insertBefore(
            verifyButton,
            generateBtn
        );

        generateBtn.parentNode.insertBefore(
            result,
            generateBtn
        );

        verifyButton.addEventListener("click", async () => {
            const data = collectCurrentSource();
            const error = validateSource(data);

            if (error) {
                if (formMessage) {
                    formMessage.textContent = error;
                }
                return;
            }

            verifyButton.disabled = true;
            verifyButton.textContent = "Verifying…";
            result.hidden = false;

            showVerificationResult(
                {
                    level: "warning",
                    title: "Checking source…",
                    message: "Please wait while SinSigma checks the source."
                },
                result
            );

            const verification =
                await verifySource(data);

            showVerificationResult(
                verification,
                result
            );

            verifyButton.disabled = false;
            verifyButton.textContent = "Verify Source";

            if (formMessage) {
                formMessage.textContent =
                    verification.title;
            }
        });
    }

    /* =========================================================
       SOURCE SUMMARY UI
    ========================================================= */

    function createSourceManager() {
        const form =
            generateBtn?.closest("form") ||
            generateBtn?.parentElement;

        if (!form) return;

        let manager =
            document.getElementById(
                "source-manager"
            );

        if (manager) return;

        manager =
            document.createElement("div");

        manager.id =
            "source-manager";

        manager.style.marginTop =
            "22px";

        const addButton =
            document.createElement("button");

        addButton.type = "button";

        addButton.id =
            "add-source-btn";

        addButton.textContent =
            "+ Add Another Source";

        addButton.style.width =
            "100%";

        addButton.style.padding =
            "12px 18px";

        addButton.style.border =
            "1px solid #111";

        addButton.style.borderRadius =
            "8px";

        addButton.style.background =
            "#fff";

        addButton.style.color =
            "#111";

        addButton.style.fontWeight =
            "600";

        addButton.style.cursor =
            "pointer";

        addButton.addEventListener(
            "click",
            () => {
                const data =
                    collectCurrentSource();

                const error =
                    validateSource(data);

                if (error) {
                    if (formMessage) {
                        formMessage.textContent =
                            error;
                    }

                    return;
                }

                sources.push(data);

                editingSourceId =
                    null;

                clearForm();

                renderSourceList();

                if (formMessage) {
                    formMessage.textContent =
                        `Source ${sources.length} added.`;
                }
            }
        );

        manager.appendChild(
            addButton
        );

        const list =
            document.createElement("div");

        list.id =
            "source-list";

        list.style.marginTop =
            "12px";

        manager.appendChild(list);

        const generateAllButton =
            document.createElement("button");

        generateAllButton.type =
            "button";

        generateAllButton.id =
            "generate-all-btn";

        generateAllButton.textContent =
            "Generate Bibliography";

        generateAllButton.style.width =
            "100%";

        generateAllButton.style.padding =
            "13px 20px";

        generateAllButton.style.marginTop =
            "12px";

        generateAllButton.style.background =
            "#111";

        generateAllButton.style.color =
            "#fff";

        generateAllButton.style.border =
            "1px solid #111";

        generateAllButton.style.borderRadius =
            "8px";

        generateAllButton.style.fontSize =
            "15px";

        generateAllButton.style.fontWeight =
            "600";

        generateAllButton.style.cursor =
            "pointer";

        generateAllButton.addEventListener(
            "click",
            generateBibliography
        );

        manager.appendChild(
            generateAllButton
        );

        form.appendChild(
            manager
        );
    }

    function renderSourceList() {
        const list =
            document.getElementById(
                "source-list"
            );

        if (!list) return;

        list.innerHTML = "";

        sources.forEach(
            (source, index) => {
                const item =
                    document.createElement(
                        "div"
                    );

                item.style.display =
                    "flex";

                item.style.alignItems =
                    "center";

                item.style.justifyContent =
                    "space-between";

                item.style.gap =
                    "10px";

                item.style.padding =
                    "10px 12px";

                item.style.marginBottom =
                    "8px";

                item.style.border =
                    "1px solid #e5e7eb";

                item.style.borderRadius =
                    "8px";

                const label =
                    document.createElement(
                        "span"
                    );

                label.textContent =
                    `Source ${index + 1}: ${source.title}`;

                const actions =
                    document.createElement("div");

                actions.style.display = "flex";
                actions.style.alignItems = "center";
                actions.style.gap = "8px";

                const verify =
                    document.createElement("button");

                verify.type = "button";
                verify.textContent = "Verify";
                verify.className = "source-verify-mini";

                verify.addEventListener("click", async () => {
                    verify.disabled = true;
                    verify.textContent = "Checking…";

                    const result = await verifySource(source);

                    verify.disabled = false;
                    verify.textContent = "Verify";

                    if (formMessage) {
                        formMessage.textContent =
                            `${result.title}: ${result.message}`;
                    }

                    source.verification = result;
                });

                actions.appendChild(verify);

                const remove =
                    document.createElement(
                        "button"
                    );

                remove.type =
                    "button";

                remove.textContent =
                    "Remove";

                remove.style.border =
                    "0";

                remove.style.background =
                    "transparent";

                remove.style.cursor =
                    "pointer";

                remove.style.fontWeight =
                    "600";

                remove.addEventListener(
                    "click",
                    () => {
                        sources.splice(
                            index,
                            1
                        );

                        renderSourceList();

                        if (
                            formMessage
                        ) {
                            formMessage.textContent =
                                "";
                        }
                    }
                );

                item.appendChild(
                    label
                );

                actions.appendChild(remove);
                item.appendChild(actions);

                list.appendChild(
                    item
                );
            }
        );
    }

    function clearForm() {
        setValue(
            authorInput,
            ""
        );

        setValue(
            yearInput,
            ""
        );

        setValue(
            titleInput,
            ""
        );

        setValue(
            publicationInput,
            ""
        );

        setValue(
            urlInput,
            ""
        );

        setValue(
            doiInput,
            ""
        );

        editingSourceId =
            null;

        updateDynamicFields();
    }

    /* =========================================================
       BIBLIOGRAPHY GENERATION
    ========================================================= */

    function generateBibliography() {
        const current =
            collectCurrentSource();

        const currentError =
            validateSource(current);

        if (
            currentError &&
            sources.length === 0
        ) {
            if (formMessage) {
                formMessage.textContent =
                    currentError;
            }

            return;
        }

        if (
            current.title &&
            !sources.some(
                source =>
                    source.id ===
                    current.id
            )
        ) {
            sources.push(current);
        }

        if (!sources.length) {
            if (formMessage) {
                formMessage.textContent =
                    "Please add at least one source.";
            }

            return;
        }

        const style =
            citationStyle?.value ||
            sources[0].style ||
            "apa";

        sources =
            sources.map(source => ({
                ...source,
                style
            }));

        let output = "";

        sources.forEach(
            (source, index) => {
                const citation =
                    formatCitation(
                        source,
                        index + 1
                    );

                output +=
                    `<div class="citation-entry" style="margin-bottom:18px;">${citation}</div>`;
            }
        );

        if (citationText) {
            citationText.innerHTML =
                output;
        }

        if (inTextCitation) {
            inTextCitation.textContent =
                generateCombinedInText(
                    sources
                );
        }

        if (citationResult) {
            citationResult.hidden =
                false;

            setTimeout(() => {
                citationResult.scrollIntoView(
                    {
                        behavior:
                            "smooth",
                        block:
                            "nearest"
                    }
                );
            }, 50);
        }

        if (copyBtn) {
            copyBtn.textContent =
                "Copy Citation";

            copyBtn.classList.remove(
                "copied"
            );
        }

        if (formMessage) {
            formMessage.textContent =
                `${sources.length} source${sources.length > 1 ? "s" : ""} ready.`;
        }
    }

    /* =========================================================
       COPY
    ========================================================= */

    async function copyCitation() {
        if (!citationText) {
            return;
        }

        const text =
            citationText.innerText.trim();

        if (!text) {
            return;
        }

        try {
            await navigator.clipboard.writeText(
                text
            );
        } catch (error) {
            const textarea =
                document.createElement(
                    "textarea"
                );

            textarea.value =
                text;

            textarea.style.position =
                "fixed";

            textarea.style.opacity =
                "0";

            document.body.appendChild(
                textarea
            );

            textarea.focus();
            textarea.select();

            document.execCommand(
                "copy"
            );

            textarea.remove();
        }

        if (copyBtn) {
            copyBtn.textContent =
                "Copied!";

            copyBtn.classList.add(
                "copied"
            );

            setTimeout(() => {
                copyBtn.textContent =
                    "Copy Citation";

                copyBtn.classList.remove(
                    "copied"
                );
            }, 1800);
        }
    }

    /* =========================================================
       EVENTS
    ========================================================= */

    document
        .querySelectorAll(
            'input[name="citation-context"]'
        )
        .forEach(radio => {
            radio.addEventListener(
                "change",
                () => {
                    updateSourceTypes();

                    if (citationResult) {
                        citationResult.hidden =
                            true;
                    }
                }
            );
        });

    if (sourceType) {
        sourceType.addEventListener(
            "change",
            () => {
                updateDynamicFields();

                if (citationResult) {
                    citationResult.hidden =
                        true;
                }
            }
        );
    }

    if (citationStyle) {
        citationStyle.addEventListener(
            "change",
            () => {
                sources =
                    sources.map(source => ({
                        ...source,
                        style:
                            citationStyle.value
                    }));

                if (
                    sources.length
                ) {
                    generateBibliography();
                }
            }
        );
    }

    if (generateBtn) {
        generateBtn.addEventListener(
            "click",
            event => {
                event.preventDefault();

                const data =
                    collectCurrentSource();

                const error =
                    validateSource(data);

                if (error) {
                    if (formMessage) {
                        formMessage.textContent =
                            error;
                    }

                    if (citationResult) {
                        citationResult.hidden =
                            true;
                    }

                    return;
                }

                sources = [data];

                renderSourceList();

                generateBibliography();
            }
        );
    }

    if (copyBtn) {
        copyBtn.addEventListener(
            "click",
            event => {
                event.preventDefault();
                copyCitation();
            }
        );
    }

    /* =========================================================
       INITIALISE
    ========================================================= */

    ensureVerificationStyles();
    updateSourceTypes();
    createCurrentVerifyUI();
    createSourceManager();

    renderSourceList();
});
