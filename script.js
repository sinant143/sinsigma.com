```javascript
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("citation-form");
    const citationStyle = document.getElementById("citation-style");
    const sourceType = document.getElementById("source-type");
    const author = document.getElementById("author");
    const year = document.getElementById("year");
    const title = document.getElementById("title");
    const publication = document.getElementById("publication");
    const url = document.getElementById("url");
    const doi = document.getElementById("doi");
    const formMessage = document.getElementById("form-message");
    const citationResult = document.getElementById("citation-result");
    const citationText = document.getElementById("citation-text");
    const inTextCitation = document.getElementById("in-text-citation");
    const copyBtn = document.getElementById("copy-btn");
    const generateBtn = document.getElementById("generate-btn");

    let sources = [];

    /*
     * ---------------------------------------------------------
     * SOURCE REGIONS
     * ---------------------------------------------------------
     */

    function ensureRegionSelector() {
        if (document.getElementById("source-region")) return;

        const styleGroup = citationStyle.closest(".form-group");
        if (!styleGroup) return;

        const group = document.createElement("div");
        group.className = "form-group";
        group.innerHTML = `
            <label for="source-region">Source Region</label>
            <select id="source-region">
                <option value="global">Global</option>
                <option value="india">India</option>
            </select>
        `;

        styleGroup.insertAdjacentElement("afterend", group);
    }

    ensureRegionSelector();

    const sourceRegion = document.getElementById("source-region");

    /*
     * ---------------------------------------------------------
     * SOURCE TYPES
     * ---------------------------------------------------------
     */

    const globalSources = [
        { value: "website", label: "Website" },
        { value: "book", label: "Book" },
        { value: "journal", label: "Journal Article" },
        { value: "newspaper", label: "Newspaper / Magazine Article" },
        { value: "report", label: "Report" },
        { value: "conference", label: "Conference Paper" },
        { value: "thesis", label: "Thesis / Dissertation" },
        { value: "video", label: "Video" }
    ];

    const indiaSources = [
        { value: "indian-kanoon", label: "Indian Kanoon" },
        { value: "supreme-court", label: "Supreme Court of India" },
        { value: "high-court", label: "High Court of India" },
        { value: "gazette", label: "Gazette Notification" },
        { value: "rbi", label: "RBI Publication" },
        { value: "sebi", label: "SEBI Publication" },
        { value: "pib", label: "PIB Press Release" },
        { value: "ministry", label: "Government Ministry" },
        { value: "gov-report", label: "Government Report" },
        { value: "act", label: "Act / Legislation" },
        { value: "indian-newspaper", label: "Indian Newspaper Article" },
        { value: "website", label: "Website" },
        { value: "book", label: "Book" },
        { value: "journal", label: "Journal Article" }
    ];

    function populateSourceTypes() {
        if (!sourceType) return;

        const region = sourceRegion ? sourceRegion.value : "global";
        const list = region === "india" ? indiaSources : globalSources;

        sourceType.innerHTML = "";

        list.forEach(item => {
            const option = document.createElement("option");
            option.value = item.value;
            option.textContent = item.label;
            sourceType.appendChild(option);
        });

        updateSourceFields();
    }

    /*
     * ---------------------------------------------------------
     * DYNAMIC FIELD HELPERS
     * ---------------------------------------------------------
     */

    const baseFields = {
        author: author ? author.closest(".form-group") : null,
        year: year ? year.closest(".form-group") : null,
        title: title ? title.closest(".form-group") : null,
        publication: publication ? publication.closest(".form-group") : null,
        url: url ? url.closest(".form-group") : null,
        doi: doi ? doi.closest(".form-group") : null
    };

    let dynamicFieldsContainer = document.getElementById("dynamic-fields");

    function getOrCreateDynamicContainer() {
        if (dynamicFieldsContainer) return dynamicFieldsContainer;

        dynamicFieldsContainer = document.createElement("div");
        dynamicFieldsContainer.id = "dynamic-fields";

        const lastBase =
            baseFields.doi ||
            baseFields.url ||
            baseFields.publication ||
            baseFields.title;

        if (lastBase) {
            lastBase.insertAdjacentElement("afterend", dynamicFieldsContainer);
        } else if (form) {
            form.appendChild(dynamicFieldsContainer);
        }

        return dynamicFieldsContainer;
    }

    function clearDynamicFields() {
        const container = getOrCreateDynamicContainer();
        container.innerHTML = "";
    }

    function createField({
        id,
        label,
        type = "text",
        placeholder = "",
        required = false,
        help = "",
        options = []
    }) {
        const group = document.createElement("div");
        group.className = "form-group dynamic-field";

        const labelEl = document.createElement("label");
        labelEl.setAttribute("for", id);
        labelEl.textContent = label;

        let input;

        if (type === "textarea") {
            input = document.createElement("textarea");
            input.rows = 3;
        } else if (type === "select") {
            input = document.createElement("select");

            options.forEach(optionData => {
                const option = document.createElement("option");
                option.value = optionData.value;
                option.textContent = optionData.label;
                input.appendChild(option);
            });
        } else {
            input = document.createElement("input");
            input.type = type;
        }

        input.id = id;
        input.name = id;
        input.placeholder = placeholder;

        if (required) {
            input.required = true;
        }

        group.appendChild(labelEl);
        group.appendChild(input);

        if (help) {
            const helpEl = document.createElement("div");
            helpEl.className = "field-help";
            helpEl.textContent = help;
            group.appendChild(helpEl);
        }

        return group;
    }

    /*
     * ---------------------------------------------------------
     * BASE FIELD LABELS
     * ---------------------------------------------------------
     */

    function setBaseFieldLabels() {
        if (!baseFields.author) return;

        const authorLabel = baseFields.author.querySelector("label");
        const yearLabel = baseFields.year?.querySelector("label");
        const titleLabel = baseFields.title?.querySelector("label");
        const publicationLabel = baseFields.publication?.querySelector("label");
        const urlLabel = baseFields.url?.querySelector("label");
        const doiLabel = baseFields.doi?.querySelector("label");

        if (authorLabel) authorLabel.textContent = "Author / Writer";
        if (yearLabel) yearLabel.textContent = "Year";
        if (titleLabel) titleLabel.textContent = "Title";
        if (publicationLabel) publicationLabel.textContent = "Website / Journal / Publisher";
        if (urlLabel) urlLabel.textContent = "URL";
        if (doiLabel) doiLabel.textContent = "DOI";
    }

    /*
     * ---------------------------------------------------------
     * SOURCE-SPECIFIC FIELDS
     * ---------------------------------------------------------
     */

    function updateSourceFields() {
        if (!sourceType) return;

        clearDynamicFields();
        setBaseFieldLabels();

        const type = sourceType.value;
        const region = sourceRegion ? sourceRegion.value : "global";
        const container = getOrCreateDynamicContainer();

        /*
         * Hide / show common fields depending on source.
         */

        Object.values(baseFields).forEach(field => {
            if (field) field.style.display = "";
        });

        if (type === "indian-kanoon") {
            if (baseFields.publication) {
                baseFields.publication.querySelector("label").textContent =
                    "Court / Publisher";
            }

            if (baseFields.url) {
                baseFields.url.querySelector("label").textContent =
                    "Indian Kanoon URL";
            }

            container.appendChild(createField({
                id: "case-name",
                label: "Case Name",
                placeholder: "e.g. Kesavananda Bharati v. State of Kerala"
            }));

            container.appendChild(createField({
                id: "case-number",
                label: "Case / Citation Number",
                placeholder: "e.g. AIR 1973 SC 1461"
            }));

            container.appendChild(createField({
                id: "court",
                label: "Court",
                placeholder: "e.g. Supreme Court of India"
            }));
        }

        if (type === "supreme-court" || type === "high-court") {
            if (baseFields.publication) {
                baseFields.publication.querySelector("label").textContent =
                    "Court";
            }

            if (baseFields.url) {
                baseFields.url.querySelector("label").textContent =
                    "Judgment URL";
            }

            container.appendChild(createField({
                id: "case-name",
                label: "Case Name",
                placeholder: "e.g. State of Maharashtra v. XYZ"
            }));

            container.appendChild(createField({
                id: "case-number",
                label: "Case / Appeal Number",
                placeholder: "e.g. Civil Appeal No. 1234 of 2025"
            }));

            container.appendChild(createField({
                id: "court",
                label: "Court",
                placeholder:
                    type === "supreme-court"
                        ? "Supreme Court of India"
                        : "High Court name"
            }));

            container.appendChild(createField({
                id: "reporter",
                label: "Law Reporter / Citation",
                placeholder: "e.g. (2025) 3 SCC 100"
            }));
        }

        if (type === "gazette") {
            if (baseFields.author) {
                baseFields.author.querySelector("label").textContent =
                    "Issuing Authority";
            }

            if (baseFields.publication) {
                baseFields.publication.querySelector("label").textContent =
                    "Gazette / Publication";
            }

            container.appendChild(createField({
                id: "notification-number",
                label: "Notification Number",
                placeholder: "e.g. G.S.R. 123(E)"
            }));

            container.appendChild(createField({
                id: "gazette-date",
                label: "Notification Date",
                type: "date"
            }));

            container.appendChild(createField({
                id: "ministry",
                label: "Ministry / Department",
                placeholder: "e.g. Ministry of Finance"
            }));
        }

        if (type === "rbi") {
            if (baseFields.author) {
                baseFields.author.querySelector("label").textContent =
                    "Author / RBI";
            }

            if (baseFields.publication) {
                baseFields.publication.querySelector("label").textContent =
                    "RBI Publication / Department";
            }

            container.appendChild(createField({
                id: "rbi-number",
                label: "Circular / Notification Number",
                placeholder: "e.g. RBI/2025-26/123"
            }));

            container.appendChild(createField({
                id: "rbi-date",
                label: "Publication Date",
                type: "date"
            }));
        }

        if (type === "sebi") {
            if (baseFields.author) {
                baseFields.author.querySelector("label").textContent =
                    "Author / SEBI";
            }

            if (baseFields.publication) {
                baseFields.publication.querySelector("label").textContent =
                    "SEBI Publication / Department";
            }

            container.appendChild(createField({
                id: "sebi-number",
                label: "Circular / Notification Number",
                placeholder: "e.g. SEBI/HO/IMD/..."
            }));

            container.appendChild(createField({
                id: "sebi-date",
                label: "Publication Date",
                type: "date"
            }));
        }

        if (type === "pib") {
            if (baseFields.author) {
                baseFields.author.querySelector("label").textContent =
                    "Ministry / Government Authority";
            }

            if (baseFields.publication) {
                baseFields.publication.querySelector("label").textContent =
                    "PIB / Ministry";
            }

            container.appendChild(createField({
                id: "release-number",
                label: "Press Release Number",
                placeholder: "e.g. PIB/2025/123"
            }));

            container.appendChild(createField({
                id: "release-date",
                label: "Release Date",
                type: "date"
            }));
        }

        if (type === "ministry") {
            if (baseFields.author) {
                baseFields.author.querySelector("label").textContent =
                    "Ministry / Department";
            }

            container.appendChild(createField({
                id: "department",
                label: "Department / Division",
                placeholder: "e.g. Department of Financial Services"
            }));

            container.appendChild(createField({
                id: "document-number",
                label: "Document / Notification Number",
                placeholder: "Optional"
            }));
        }

        if (type === "gov-report") {
            if (baseFields.author) {
                baseFields.author.querySelector("label").textContent =
                    "Government Agency / Author";
            }

            if (baseFields.publication) {
                baseFields.publication.querySelector("label").textContent =
                    "Ministry / Department / Publisher";
            }

            container.appendChild(createField({
                id: "report-number",
                label: "Report Number",
                placeholder: "Optional"
            }));

            container.appendChild(createField({
                id: "report-place",
                label: "Place of Publication",
                placeholder: "e.g. New Delhi"
            }));
        }

        if (type === "act") {
            if (baseFields.author) {
                baseFields.author.querySelector("label").textContent =
                    "Legislature / Authority";
            }

            if (baseFields.publication) {
                baseFields.publication.querySelector("label").textContent =
                    "Act / Legislative Source";
            }

            container.appendChild(createField({
                id: "act-number",
                label: "Act Number",
                placeholder: "e.g. Act No. 12 of 2025"
            }));

            container.appendChild(createField({
                id: "section",
                label: "Section / Article",
                placeholder: "e.g. Section 43"
            }));

            container.appendChild(createField({
                id: "assent-date",
                label: "Assent / Enactment Date",
                type: "date"
            }));
        }

        if (type === "indian-newspaper") {
            if (baseFields.publication) {
                baseFields.publication.querySelector("label").textContent =
                    "Newspaper / Magazine";
            }

            container.appendChild(createField({
                id: "edition",
                label: "Edition",
                placeholder: "e.g. Mumbai Edition"
            }));

            container.appendChild(createField({
                id: "page",
                label: "Page",
                placeholder: "e.g. 5"
            }));

            container.appendChild(createField({
                id: "publication-date",
                label: "Publication Date",
                type: "date"
            }));
        }

        if (type === "journal") {
            if (baseFields.publication) {
                baseFields.publication.querySelector("label").textContent =
                    "Journal Name";
            }

            container.appendChild(createField({
                id: "volume",
                label: "Volume",
                placeholder: "e.g. 12"
            }));

            container.appendChild(createField({
                id: "issue",
                label: "Issue",
                placeholder: "e.g. 3"
            }));

            container.appendChild(createField({
                id: "pages",
                label: "Pages",
                placeholder: "e.g. 45–67"
            }));
        }

        if (type === "book") {
            if (baseFields.publication) {
                baseFields.publication.querySelector("label").textContent =
                    "Publisher";
            }

            container.appendChild(createField({
                id: "edition",
                label: "Edition",
                placeholder: "e.g. 3rd ed."
            }));
        }

        if (type === "report" || type === "conference" || type === "thesis") {
            if (baseFields.publication) {
                baseFields.publication.querySelector("label").textContent =
                    type === "thesis"
                        ? "University / Institution"
                        : "Publisher / Organization";
            }

            if (type === "report") {
                container.appendChild(createField({
                    id: "report-number",
                    label: "Report Number",
                    placeholder: "Optional"
                }));
            }

            if (type === "conference") {
                container.appendChild(createField({
                    id: "conference-name",
                    label: "Conference Name",
                    placeholder: "e.g. IEEE International Conference"
                }));

                container.appendChild(createField({
                    id: "pages",
                    label: "Pages",
                    placeholder: "e.g. 120–126"
                }));
            }

            if (type === "thesis") {
                container.appendChild(createField({
                    id: "degree",
                    label: "Degree",
                    placeholder: "e.g. PhD dissertation"
                }));
            }
        }

        if (type === "newspaper") {
            if (baseFields.publication) {
                baseFields.publication.querySelector("label").textContent =
                    "Newspaper / Magazine";
            }

            container.appendChild(createField({
                id: "publication-date",
                label: "Publication Date",
                type: "date"
            }));

            container.appendChild(createField({
                id: "page",
                label: "Page",
                placeholder: "Optional"
            }));
        }

        if (type === "video") {
            if (baseFields.publication) {
                baseFields.publication.querySelector("label").textContent =
                    "Channel / Publisher";
            }

            container.appendChild(createField({
                id: "platform",
                label: "Platform",
                placeholder: "e.g. YouTube"
            }));

            container.appendChild(createField({
                id: "video-date",
                label: "Published Date",
                type: "date"
            }));
        }

        if (region === "global" && type === "website") {
            if (baseFields.publication) {
                baseFields.publication.querySelector("label").textContent =
                    "Website / Publisher";
            }
        }
    }

    /*
     * ---------------------------------------------------------
     * COLLECT FORM DATA
     * ---------------------------------------------------------
     */

    function valueOf(id) {
        const element = document.getElementById(id);
        return element ? element.value.trim() : "";
    }

    function collectCurrentSource() {
        const source = {
            style: citationStyle ? citationStyle.value : "apa",
            region: sourceRegion ? sourceRegion.value : "global",
            type: sourceType ? sourceType.value : "website",

            author: author ? author.value.trim() : "",
            year: year ? year.value.trim() : "",
            title: title ? title.value.trim() : "",
            publication: publication ? publication.value.trim() : "",
            url: url ? url.value.trim() : "",
            doi: doi ? doi.value.trim() : "",

            fields: {}
        };

        const dynamicContainer = document.getElementById("dynamic-fields");

        if (dynamicContainer) {
            dynamicContainer.querySelectorAll("input, textarea, select").forEach(input => {
                source.fields[input.id] = input.value.trim();
            });
        }

        return source;
    }

    /*
     * ---------------------------------------------------------
     * VALIDATION
     * ---------------------------------------------------------
     */

    function validateSource(source) {
        if (!source.title) {
            return "Please enter the source title.";
        }

        if (!source.year && !source.fields["publication-date"] && !source.fields["gazette-date"] &&
            !source.fields["rbi-date"] && !source.fields["sebi-date"] &&
            !source.fields["release-date"]) {
            return "Please enter the publication year or date.";
        }

        return "";
    }

    /*
     * ---------------------------------------------------------
     * FORMAT HELPERS
     * ---------------------------------------------------------
     */

    function clean(value) {
        return (value || "").trim();
    }

    function italic(text) {
        return text ? `<em>${escapeHtml(text)}</em>` : "";
    }

    function escapeHtml(text) {
        return String(text || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function plain(text) {
        return String(text || "")
            .replace(/<[^>]*>/g, "")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'");
    }

    function formatAuthorAPA(value) {
        if (!value) return "";

        const authors = value
            .split(",")
            .map(a => a.trim())
            .filter(Boolean);

        return authors
            .map(name => {
                if (name.includes(",")) return name;

                const parts = name.split(/\s+/);
                if (parts.length === 1) return parts[0];

                const last = parts.pop();
                const initials = parts
                    .map(p => p.charAt(0).toUpperCase() + ".")
                    .join(" ");

                return `${last}, ${initials}`;
            })
            .join(", ");
    }

    function shortAuthor(authorValue) {
        if (!authorValue) return "Unknown";

        const first = authorValue.split(",")[0].trim();

        if (first.includes(",")) {
            return first.split(",")[0].trim();
        }

        const parts = first.split(/\s+/);

        return parts.length > 1
            ? parts[parts.length - 1]
            : parts[0];
    }

    function getDate(source) {
        return (
            source.year ||
            source.fields["publication-date"] ||
            source.fields["gazette-date"] ||
            source.fields["rbi-date"] ||
            source.fields["sebi-date"] ||
            source.fields["release-date"] ||
            source.fields["assent-date"] ||
            ""
        );
    }

    function getYear(source) {
        const date = getDate(source);
        const match = String(date).match(/\d{4}/);
        return match ? match[0] : "";
    }

    /*
     * ---------------------------------------------------------
     * GLOBAL FORMATS
     * ---------------------------------------------------------
     */

    function formatGlobal(source, number) {
        const style = source.style;
        const a = clean(source.author);
        const apaAuthor = formatAuthorAPA(a);
        const last = shortAuthor(a);
        const y = getYear(source);
        const t = clean(source.title);
        const p = clean(source.publication);
        const u = clean(source.url);
        const d = clean(source.doi);

        const doiUrl = d
            ? (d.startsWith("http") ? d : `https://doi.org/${d}`)
            : "";

        if (source.type === "website") {
            if (style === "apa") {
                return `${apaAuthor ? apaAuthor + ". " : ""}(${y || "n.d."}). ${italic(t)}. ${p ? escapeHtml(p) + ". " : ""}${escapeHtml(u)}`;
            }

            if (style === "mla") {
                return `${a ? escapeHtml(a) + ". " : ""}${italic(t)}. ${p ? escapeHtml(p) + ", " : ""}${y || "n.d."}, ${escapeHtml(u)}.`;
            }

            if (style === "harvard") {
                return `${escapeHtml(a || p)} (${y || "n.d."}) ${italic(t)}. Available at: ${escapeHtml(u)}.`;
            }

            if (style === "chicago") {
                return `${a ? escapeHtml(a) + ". " : ""}${italic(t)}. ${p ? escapeHtml(p) + ", " : ""}${y || "n.d."}. ${escapeHtml(u)}.`;
            }

            if (style === "ieee") {
                return `[${number}] ${a ? escapeHtml(a) + ", " : ""}"${escapeHtml(t)}," ${p ? escapeHtml(p) + ", " : ""}${y || "n.d."}. [Online]. Available: ${escapeHtml(u)}`;
            }

            if (style === "vancouver") {
                return `${number}. ${escapeHtml(a || p)}. ${escapeHtml(t)}. ${p ? escapeHtml(p) + ". " : ""}${y || "n.d."}. Available from: ${escapeHtml(u)}`;
            }
        }

        if (source.type === "book") {
            const edition = clean(source.fields.edition);

            if (style === "apa") {
                return `${escapeHtml(apaAuthor)} (${y}). ${italic(t)}${edition ? ` (${escapeHtml(edition)}).` : "."} ${escapeHtml(p)}.`;
            }

            if (style === "mla") {
                return `${escapeHtml(a)}. ${italic(t)}${edition ? `, ${escapeHtml(edition)}` : ""}. ${escapeHtml(p)}, ${y}.`;
            }

            if (style === "harvard") {
                return `${escapeHtml(a)} (${y}) ${italic(t)}${edition ? `, ${escapeHtml(edition)}` : ""}. ${escapeHtml(p)}.`;
            }

            if (style === "chicago") {
                return `${escapeHtml(a)}. ${italic(t)}${edition ? `, ${escapeHtml(edition)}` : ""}. ${escapeHtml(p)}, ${y}.`;
            }

            if (style === "ieee") {
                return `[${number}] ${escapeHtml(a)}, ${italic(t)}${edition ? `, ${escapeHtml(edition)}` : ""}. ${escapeHtml(p)}, ${y}.`;
            }

            if (style === "vancouver") {
                return `${number}. ${escapeHtml(a)}. ${escapeHtml(t)}${edition ? `. ${escapeHtml(edition)}` : ""}. ${escapeHtml(p)}; ${y}.`;
            }
        }

        if (source.type === "journal") {
            const volume = clean(source.fields.volume);
            const issue = clean(source.fields.issue);
            const pages = clean(source.fields.pages);

            if (style === "apa") {
                return `${escapeHtml(apaAuthor)} (${y}). ${escapeHtml(t)}. ${italic(p)}${volume ? `, ${escapeHtml(volume)}` : ""}${issue ? `(${escapeHtml(issue)})` : ""}${pages ? `, ${escapeHtml(pages)}` : ""}.${doiUrl ? ` ${escapeHtml(doiUrl)}` : ""}`;
            }

            if (style === "mla") {
                return `${escapeHtml(a)}. "${escapeHtml(t)}." ${italic(p)}${volume ? `, vol. ${escapeHtml(volume)}` : ""}${issue ? `, no. ${escapeHtml(issue)}` : ""}, ${y}${pages ? `, pp. ${escapeHtml(pages)}` : ""}.${doiUrl ? ` ${escapeHtml(doiUrl)}` : ""}`;
            }

            if (style === "harvard") {
                return `${escapeHtml(a)} (${y}) '${escapeHtml(t)}', ${italic(p)}${volume ? `, ${escapeHtml(volume)}` : ""}${issue ? `(${escapeHtml(issue)})` : ""}${pages ? `, pp. ${escapeHtml(pages)}` : ""}.${doiUrl ? ` ${escapeHtml(doiUrl)}` : ""}`;
            }

            if (style === "chicago") {
                return `${escapeHtml(a)}. "${escapeHtml(t)}." ${italic(p)} ${volume || ""}${issue ? `, no. ${escapeHtml(issue)}` : ""} (${y})${pages ? `: ${escapeHtml(pages)}` : ""}.${doiUrl ? ` ${escapeHtml(doiUrl)}` : ""}`;
            }

            if (style === "ieee") {
                return `[${number}] ${escapeHtml(a)}, "${escapeHtml(t)}," ${italic(p)}${volume ? `, vol. ${escapeHtml(volume)}` : ""}${issue ? `, no. ${escapeHtml(issue)}` : ""}${pages ? `, pp. ${escapeHtml(pages)}` : ""}, ${y}.${doiUrl ? ` [Online]. Available: ${escapeHtml(doiUrl)}` : ""}`;
            }

            if (style === "vancouver") {
                return `${number}. ${escapeHtml(a)}. ${escapeHtml(t)}. ${italic(p)}. ${y}${volume ? `;${escapeHtml(volume)}` : ""}${issue ? `(${escapeHtml(issue)})` : ""}${pages ? `:${escapeHtml(pages)}` : ""}.`;
            }
        }

        if (source.type === "newspaper" || source.type === "indian-newspaper") {
            const date =
                source.fields["publication-date"] ||
                source.year ||
                "";

            const page = clean(source.fields.page);

            if (style === "apa") {
                return `${escapeHtml(apaAuthor)} (${escapeHtml(date) || "n.d."}). ${escapeHtml(t)}. ${italic(p)}${page ? `, p. ${escapeHtml(page)}` : ""}.${u ? ` ${escapeHtml(u)}` : ""}`;
            }

            if (style === "mla") {
                return `${escapeHtml(a)}. "${escapeHtml(t)}." ${italic(p)}, ${escapeHtml(date)}${page ? `, p. ${escapeHtml(page)}` : ""}.${u ? ` ${escapeHtml(u)}` : ""}`;
            }

            if (style === "harvard") {
                return `${escapeHtml(a)} (${escapeHtml(date) || "n.d."}) '${escapeHtml(t)}', ${italic(p)}${page ? `, p. ${escapeHtml(page)}` : ""}.${u ? ` Available at: ${escapeHtml(u)}.` : ""}`;
            }

            if (style === "chicago") {
                return `${escapeHtml(a)}. "${escapeHtml(t)}." ${italic(p)}, ${escapeHtml(date)}${page ? `, ${escapeHtml(page)}` : ""}.${u ? ` ${escapeHtml(u)}.` : ""}`;
            }

            if (style === "ieee") {
                return `[${number}] ${escapeHtml(a)}, "${escapeHtml(t)}," ${italic(p)}, ${escapeHtml(date)}${page ? `, p. ${escapeHtml(page)}` : ""}.${u ? ` [Online]. Available: ${escapeHtml(u)}` : ""}`;
            }

            return `${number}. ${escapeHtml(a)}. ${escapeHtml(t)}. ${italic(p)}. ${escapeHtml(date)}${page ? `: ${escapeHtml(page)}` : ""}.${u ? ` Available from: ${escapeHtml(u)}` : ""}`;
        }

        /*
         * Generic fallback for report, conference, thesis, video.
         */

        if (style === "apa") {
            return `${escapeHtml(apaAuthor || p)} (${y || "n.d."}). ${italic(t)}. ${escapeHtml(p)}.${u ? ` ${escapeHtml(u)}` : ""}`;
        }

        if (style === "mla") {
            return `${escapeHtml(a || p)}. ${italic(t)}. ${escapeHtml(p)}, ${y || "n.d."}.${u ? ` ${escapeHtml(u)}` : ""}`;
        }

        if (style === "harvard") {
            return `${escapeHtml(a || p)} (${y || "n.d."}) ${italic(t)}. ${escapeHtml(p)}.${u ? ` Available at: ${escapeHtml(u)}.` : ""}`;
        }

        if (style === "chicago") {
            return `${escapeHtml(a || p)}. ${italic(t)}. ${escapeHtml(p)}, ${y || "n.d."}.${u ? ` ${escapeHtml(u)}.` : ""}`;
        }

        if (style === "ieee") {
            return `[${number}] ${escapeHtml(a || p)}, ${italic(t)}, ${escapeHtml(p)}, ${y || "n.d."}.${u ? ` [Online]. Available: ${escapeHtml(u)}` : ""}`;
        }

        return `${number}. ${escapeHtml(a || p)}. ${escapeHtml(t)}. ${escapeHtml(p)}; ${y || "n.d."}.${u ? ` Available from: ${escapeHtml(u)}` : ""}`;
    }

    /*
     * ---------------------------------------------------------
     * INDIA FORMATS
     * ---------------------------------------------------------
     */

    function formatIndia(source, number) {
        const style = source.style;
        const type = source.type;

        const a = clean(source.author);
        const t = clean(source.title);
        const p = clean(source.publication);
        const u = clean(source.url);
        const y = getYear(source);

        const caseName = clean(source.fields["case-name"]);
        const caseNumber = clean(source.fields["case-number"]);
        const court = clean(source.fields["court"]) || p;
        const reporter = clean(source.fields["reporter"]);
        const notification = clean(source.fields["notification-number"]);
        const ministry = clean(source.fields["ministry"]);
        const rbiNumber = clean(source.fields["rbi-number"]);
        const sebiNumber = clean(source.fields["sebi-number"]);
        const releaseNumber = clean(source.fields["release-number"]);
        const department = clean(source.fields["department"]);
        const documentNumber = clean(source.fields["document-number"]);
        const actNumber = clean(source.fields["act-number"]);
        const section = clean(source.fields["section"]);
        const reportNumber = clean(source.fields["report-number"]);

        /*
         * Legal cases
         */

        if (
            type === "indian-kanoon" ||
            type === "supreme-court" ||
            type === "high-court"
        ) {
            const name = caseName || t;

            if (style === "apa") {
                return `${escapeHtml(name)}${reporter ? `, ${escapeHtml(reporter)}` : ""}${caseNumber ? ` (${escapeHtml(caseNumber)})` : ""}. ${escapeHtml(court)}.${u ? ` ${escapeHtml(u)}` : ""}`;
            }

            if (style === "mla") {
                return `${escapeHtml(name)}${caseNumber ? `, ${escapeHtml(caseNumber)}` : ""}. ${escapeHtml(court)}${reporter ? `, ${escapeHtml(reporter)}` : ""}${y ? `, ${y}` : ""}.${u ? ` ${escapeHtml(u)}` : ""}`;
            }

            if (style === "harvard") {
                return `${escapeHtml(name)} (${y || "n.d."})${reporter ? ` ${escapeHtml(reporter)}` : ""}. ${escapeHtml(court)}.${u ? ` Available at: ${escapeHtml(u)}.` : ""}`;
            }

            if (style === "chicago") {
                return `${escapeHtml(name)}${reporter ? `, ${escapeHtml(reporter)}` : ""}. ${escapeHtml(court)}, ${y || "n.d."}.${u ? ` ${escapeHtml(u)}.` : ""}`;
            }

            if (style === "ieee") {
                return `[${number}] ${escapeHtml(name)}, ${escapeHtml(court)}${reporter ? `, ${escapeHtml(reporter)}` : ""}${y ? `, ${y}` : ""}.${u ? ` [Online]. Available: ${escapeHtml(u)}` : ""}`;
            }

            return `${number}. ${escapeHtml(name)}. ${escapeHtml(court)}${reporter ? `; ${escapeHtml(reporter)}` : ""}${y ? `; ${y}` : ""}.${u ? ` Available from: ${escapeHtml(u)}` : ""}`;
        }

        /*
         * Gazette
         */

        if (type === "gazette") {
            const authority = a || ministry || "Government of India";
            const date =
                source.fields["gazette-date"] ||
                y ||
                "";

            const core =
                `${escapeHtml(authority)}. ${italic(t)}${notification ? `, ${escapeHtml(notification)}` : ""}. ${escapeHtml(p)}`;

            if (style === "apa") {
                return `${core} (${escapeHtml(date) || "n.d."}).${u ? ` ${escapeHtml(u)}` : ""}`;
            }

            if (style === "mla") {
                return `${core}, ${escapeHtml(date) || "n.d."}.${u ? ` ${escapeHtml(u)}` : ""}`;
            }

            if (style === "harvard") {
                return `${escapeHtml(authority)} (${escapeHtml(date) || "n.d."}) ${italic(t)}${notification ? ` (${escapeHtml(notification)})` : ""}. ${escapeHtml(p)}.${u ? ` Available at: ${escapeHtml(u)}.` : ""}`;
            }

            if (style === "chicago") {
                return `${core}, ${escapeHtml(date) || "n.d."}.${u ? ` ${escapeHtml(u)}.` : ""}`;
            }

            if (style === "ieee") {
                return `[${number}] ${core}, ${escapeHtml(date) || "n.d."}.${u ? ` [Online]. Available: ${escapeHtml(u)}` : ""}`;
            }

            return `${number}. ${core}. ${escapeHtml(date) || "n.d."}.${u ? ` Available from: ${escapeHtml(u)}` : ""}`;
        }

        /*
         * RBI
         */

        if (type === "rbi") {
            const authority = a || "Reserve Bank of India";
            const date = source.fields["rbi-date"] || y || "";

            if (style === "apa") {
                return `${escapeHtml(authority)} (${escapeHtml(date) || "n.d."}). ${italic(t)}${rbiNumber ? ` (${escapeHtml(rbiNumber)})` : ""}. ${escapeHtml(p)}.${u ? ` ${escapeHtml(u)}` : ""}`;
            }

            if (style === "mla") {
                return `${escapeHtml(authority)}. ${italic(t)}${rbiNumber ? `, ${escapeHtml(rbiNumber)}` : ""}. ${escapeHtml(p)}, ${escapeHtml(date) || "n.d."}.${u ? ` ${escapeHtml(u)}` : ""}`;
            }

            if (style === "harvard") {
                return `${escapeHtml(authority)} (${escapeHtml(date) || "n.d."}) ${italic(t)}${rbiNumber ? ` (${escapeHtml(rbiNumber)})` : ""}. ${escapeHtml(p)}.${u ? ` Available at: ${escapeHtml(u)}.` : ""}`;
            }

            if (style === "chicago") {
                return `${escapeHtml(authority)}. ${italic(t)}${rbiNumber ? `, ${escapeHtml(rbiNumber)}` : ""}. ${escapeHtml(p)}, ${escapeHtml(date) || "n.d."}.${u ? ` ${escapeHtml(u)}.` : ""}`;
            }

            if (style === "ieee") {
                return `[${number}] ${escapeHtml(authority)}, "${escapeHtml(t)}," ${escapeHtml(p)}${rbiNumber ? `, ${escapeHtml(rbiNumber)}` : ""}, ${escapeHtml(date) || "n.d."}.${u ? ` [Online]. Available: ${escapeHtml(u)}` : ""}`;
            }

            return `${number}. ${escapeHtml(authority)}. ${escapeHtml(t)}. ${escapeHtml(p)}${rbiNumber ? `; ${escapeHtml(rbiNumber)}` : ""}; ${escapeHtml(date) || "n.d."}.${u ? ` Available from: ${escapeHtml(u)}` : ""}`;
        }

        /*
         * SEBI
         */

        if (type === "sebi") {
            const authority = a || "Securities and Exchange Board of India";
            const date = source.fields["sebi-date"] || y || "";

            if (style === "apa") {
                return `${escapeHtml(authority)} (${escapeHtml(date) || "n.d."}). ${italic(t)}${sebiNumber ? ` (${escapeHtml(sebiNumber)})` : ""}. ${escapeHtml(p)}.${u ? ` ${escapeHtml(u)}` : ""}`;
            }

            if (style === "mla") {
                return `${escapeHtml(authority)}. ${italic(t)}${sebiNumber ? `, ${escapeHtml(sebiNumber)}` : ""}. ${escapeHtml(p)}, ${escapeHtml(date) || "n.d."}.${u ? ` ${escapeHtml(u)}` : ""}`;
            }

            if (style === "harvard") {
                return `${escapeHtml(authority)} (${escapeHtml(date) || "n.d."}) ${italic(t)}${sebiNumber ? ` (${escapeHtml(sebiNumber)})` : ""}. ${escapeHtml(p)}.${u ? ` Available at: ${escapeHtml(u)}.` : ""}`;
            }

            if (style === "chicago") {
                return `${escapeHtml(authority)}. ${italic(t)}${sebiNumber ? `, ${escapeHtml(sebiNumber)}` : ""}. ${escapeHtml(p)}, ${escapeHtml(date) || "n.d."}.${u ? ` ${escapeHtml(u)}.` : ""}`;
            }

            if (style === "ieee") {
                return `[${number}] ${escapeHtml(authority)}, "${escapeHtml(t)}," ${escapeHtml(p)}${sebiNumber ? `, ${escapeHtml(sebiNumber)}` : ""}, ${escapeHtml(date) || "n.d."}.${u ? ` [Online]. Available: ${escapeHtml(u)}` : ""}`;
            }

            return `${number}. ${escapeHtml(authority)}. ${escapeHtml(t)}. ${escapeHtml(p)}${sebiNumber ? `; ${escapeHtml(sebiNumber)}` : ""}; ${escapeHtml(date) || "n.d."}.${u ? ` Available from: ${escapeHtml(u)}` : ""}`;
        }

        /*
         * PIB
         */

        if (type === "pib") {
            const authority = a || ministry || "Government of India";
            const date = source.fields["release-date"] || y || "";

            if (style === "apa") {
                return `${escapeHtml(authority)} (${escapeHtml(date) || "n.d."}). ${italic(t)}${releaseNumber ? ` (${escapeHtml(releaseNumber)})` : ""}. Press Information Bureau.${u ? ` ${escapeHtml(u)}` : ""}`;
            }

            if (style === "mla") {
                return `${escapeHtml(authority)}. "${escapeHtml(t)}." Press Information Bureau${releaseNumber ? `, ${escapeHtml(releaseNumber)}` : ""}, ${escapeHtml(date) || "n.d."}.${u ? ` ${escapeHtml(u)}` : ""}`;
            }

            if (style === "harvard") {
                return `${escapeHtml(authority)} (${escapeHtml(date) || "n.d."}) ${italic(t)}${releaseNumber ? ` (${escapeHtml(releaseNumber)})` : ""}. Press Information Bureau.${u ? ` Available at: ${escapeHtml(u)}.` : ""}`;
            }

            if (style === "chicago") {
                return `${escapeHtml(authority)}. "${escapeHtml(t)}." Press Information Bureau${releaseNumber ? `, ${escapeHtml(releaseNumber)}` : ""}, ${escapeHtml(date) || "n.d."}.${u ? ` ${escapeHtml(u)}.` : ""}`;
            }

            if (style === "ieee") {
                return `[${number}] ${escapeHtml(authority)}, "${escapeHtml(t)}," Press Information Bureau${releaseNumber ? `, ${escapeHtml(releaseNumber)}` : ""}, ${escapeHtml(date) || "n.d."}.${u ? ` [Online]. Available: ${escapeHtml(u)}` : ""}`;
            }

            return `${number}. ${escapeHtml(authority)}. ${escapeHtml(t)}. Press Information Bureau${releaseNumber ? `; ${escapeHtml(releaseNumber)}` : ""}; ${escapeHtml(date) || "n.d."}.${u ? ` Available from: ${escapeHtml(u)}` : ""}`;
        }

        /*
         * Ministry / Government Report
         */

        if (type === "ministry" || type === "gov-report") {
            const authority = a || department || ministry || p || "Government of India";
            const reportNo = reportNumber || documentNumber || "";
            const yValue = y || "n.d.";

            if (style === "apa") {
                return `${escapeHtml(authority)} (${escapeHtml(yValue)}). ${italic(t)}${reportNo ? ` (${escapeHtml(reportNo)})` : ""}. ${escapeHtml(p)}.${u ? ` ${escapeHtml(u)}` : ""}`;
            }

            if (style === "mla") {
                return `${escapeHtml(authority)}. ${italic(t)}${reportNo ? `, ${escapeHtml(reportNo)}` : ""}. ${escapeHtml(p)}, ${escapeHtml(yValue)}.${u ? ` ${escapeHtml(u)}` : ""}`;
            }

            if (style === "harvard") {
                return `${escapeHtml(authority)} (${escapeHtml(yValue)}) ${italic(t)}${reportNo ? ` (${escapeHtml(reportNo)})` : ""}. ${escapeHtml(p)}.${u ? ` Available at: ${escapeHtml(u)}.` : ""}`;
            }

            if (style === "chicago") {
                return `${escapeHtml(authority)}. ${italic(t)}${reportNo ? `, ${escapeHtml(reportNo)}` : ""}. ${escapeHtml(p)}, ${escapeHtml(yValue)}.${u ? ` ${escapeHtml(u)}.` : ""}`;
            }

            if (style === "ieee") {
                return `[${number}] ${escapeHtml(authority)}, ${italic(t)}${reportNo ? `, ${escapeHtml(reportNo)}` : ""}, ${escapeHtml(p)}, ${escapeHtml(yValue)}.${u ? ` [Online]. Available: ${escapeHtml(u)}` : ""}`;
            }

            return `${number}. ${escapeHtml(authority)}. ${escapeHtml(t)}${reportNo ? `; ${escapeHtml(reportNo)}` : ""}. ${escapeHtml(p)}; ${escapeHtml(yValue)}.${u ? ` Available from: ${escapeHtml(u)}` : ""}`;
        }

        /*
         * Act / Legislation
         */

        if (type === "act") {
            const authority = a || "India";
            const yValue = y || "n.d.";

            if (style === "apa") {
                return `${escapeHtml(authority)}. (${escapeHtml(yValue)}). ${italic(t)}${actNumber ? ` (${escapeHtml(actNumber)})` : ""}${section ? `, ${escapeHtml(section)}` : ""}.${u ? ` ${escapeHtml(u)}` : ""}`;
            }

            if (style === "mla") {
                return `${italic(t)}${actNumber ? `, ${escapeHtml(actNumber)}` : ""}. ${escapeHtml(authority)}, ${escapeHtml(yValue)}${section ? `, ${escapeHtml(section)}` : ""}.${u ? ` ${escapeHtml(u)}` : ""}`;
            }

            if (style === "harvard") {
                return `${escapeHtml(authority)} (${escapeHtml(yValue)}) ${italic(t)}${actNumber ? ` (${escapeHtml(actNumber)})` : ""}${section ? `, ${escapeHtml(section)}` : ""}.${u ? ` Available at: ${escapeHtml(u)}.` : ""}`;
            }

            if (style === "chicago") {
                return `${italic(t)}${actNumber ? `, ${escapeHtml(actNumber)}` : ""}. ${escapeHtml(authority)}, ${escapeHtml(yValue)}${section ? `, ${escapeHtml(section)}` : ""}.${u ? ` ${escapeHtml(u)}.` : ""}`;
            }

            if (style === "ieee") {
                return `[${number}] ${italic(t)}${actNumber ? `, ${escapeHtml(actNumber)}` : ""}, ${escapeHtml(authority)}, ${escapeHtml(yValue)}${section ? `, ${escapeHtml(section)}` : ""}.${u ? ` [Online]. Available: ${escapeHtml(u)}` : ""}`;
            }

            return `${number}. ${escapeHtml(authority)}. ${escapeHtml(t)}${actNumber ? `; ${escapeHtml(actNumber)}` : ""}${section ? `; ${escapeHtml(section)}` : ""}; ${escapeHtml(yValue)}.${u ? ` Available from: ${escapeHtml(u)}` : ""}`;
        }

        return formatGlobal(source, number);
    }

    function formatSource(source, number) {
        if (source.region === "india") {
            return formatIndia(source, number);
        }

        return formatGlobal(source, number);
    }

    /*
     * ---------------------------------------------------------
     * IN-TEXT CITATIONS
     * ---------------------------------------------------------
     */

    function getInTextCitation(source, number) {
        const style = source.style;
        const authorName = shortAuthor(source.author);
        const year = getYear(source);

        if (
            source.type === "indian-kanoon" ||
            source.type === "supreme-court" ||
            source.type === "high-court"
        ) {
            const caseName =
                source.fields["case-name"] ||
                source.title ||
                "Case";

            if (style === "ieee" || style === "vancouver") {
                return `[${number}]`;
            }

            if (style === "mla") {
                return `(${caseName})`;
            }

            return `(${caseName}${year ? `, ${year}` : ""})`;
        }

        if (style === "ieee" || style === "vancouver") {
            return `[${number}]`;
        }

        if (style === "mla") {
            return authorName !== "Unknown"
                ? `(${authorName})`
                : `(${source.title})`;
        }

        if (style === "chicago") {
            return `(${authorName}${year ? ` ${year}` : ""})`;
        }

        return `(${authorName}${year ? `, ${year}` : ""})`;
    }

    /*
     * ---------------------------------------------------------
     * SOURCE MANAGER UI
     * ---------------------------------------------------------
     */

    function ensureSourceManager() {
        if (document.getElementById("source-manager")) return;

        const manager = document.createElement("div");
        manager.id = "source-manager";
        manager.className = "source-manager";

        manager.innerHTML = `
            <div class="source-manager-actions">
                <button type="button" id="add-source-btn" class="hero-button">
                    + Add Another Source
                </button>

                <button type="button" id="generate-bibliography-btn" class="generate-btn">
                    Generate Bibliography
                </button>
            </div>

            <div id="source-list"></div>
        `;

        if (citationResult && citationResult.parentElement) {
            citationResult.parentElement.insertBefore(
                manager,
                citationResult
            );
        } else if (form) {
            form.insertAdjacentElement("afterend", manager);
        }

        document
            .getElementById("add-source-btn")
            .addEventListener("click", addCurrentSource);

        document
            .getElementById("generate-bibliography-btn")
            .addEventListener("click", generateBibliography);
    }

    ensureSourceManager();

    function renderSourceList() {
        const list = document.getElementById("source-list");
        if (!list) return;

        list.innerHTML = "";

        sources.forEach((source, index) => {
            const card = document.createElement("div");
            card.className = "source-item";

            const regionLabel =
                source.region === "india"
                    ? "India"
                    : "Global";

            const typeLabel = getSourceTypeLabel(source.type);

            card.innerHTML = `
                <div>
                    <strong>Source ${index + 1}</strong>
                    <div>${escapeHtml(source.title)}</div>
                    <small>
                        ${escapeHtml(source.style.toUpperCase())}
                        · ${escapeHtml(regionLabel)}
                        · ${escapeHtml(typeLabel)}
                    </small>
                </div>

                <button type="button" class="remove-source-btn" data-index="${index}">
                    Remove
                </button>
            `;

            list.appendChild(card);
        });

        list.querySelectorAll(".remove-source-btn").forEach(button => {
            button.addEventListener("click", () => {
                const index = Number(button.dataset.index);
                sources.splice(index, 1);
                renderSourceList();

                if (sources.length === 0 && citationResult) {
                    citationResult.hidden = true;
                }
            });
        });
    }

    function getSourceTypeLabel(value) {
        const all = [...globalSources, ...indiaSources];
        const item = all.find(x => x.value === value);

        return item ? item.label : value;
    }

    function addCurrentSource() {
        const current = collectCurrentSource();
        const error = validateSource(current);

        if (error) {
            showMessage(error, true);
            return;
        }

        sources.push(current);
        renderSourceList();

        showMessage(
            `Source ${sources.length} added to your bibliography.`,
            false
        );

        resetSourceForm();
    }

    function resetSourceForm() {
        if (author) author.value = "";
        if (year) year.value = "";
        if (title) title.value = "";
        if (publication) publication.value = "";
        if (url) url.value = "";
        if (doi) doi.value = "";

        const dynamicContainer = document.getElementById("dynamic-fields");

        if (dynamicContainer) {
            dynamicContainer
                .querySelectorAll("input, textarea, select")
                .forEach(input => {
                    input.value = "";
                });
        }

        citationResult.hidden = true;
        setBaseFieldLabels();
        updateSourceFields();
    }

    /*
     * ---------------------------------------------------------
     * BIBLIOGRAPHY
     * ---------------------------------------------------------
     */

    function generateBibliography() {
        if (sources.length === 0) {
            const current = collectCurrentSource();
            const error = validateSource(current);

            if (error) {
                showMessage(
                    "Add at least one valid source before generating the bibliography.",
                    true
                );
                return;
            }

            sources.push(current);
            renderSourceList();
        }

        const style = sources[0].style;

        /*
         * All sources should use the selected style.
         */

        sources = sources.map(source => ({
            ...source,
            style
        }));

        const references = sources.map((source, index) => {
            return formatSource(source, index + 1);
        });

        const inTexts = sources.map((source, index) => {
            return getInTextCitation(source, index + 1);
        });

        citationText.innerHTML = references
            .map((reference, index) => {
                return `<div class="reference-item">${reference}</div>`;
            })
            .join("");

        let combinedInText = "";

        if (style === "ieee" || style === "vancouver") {
            combinedInText = inTexts.join(", ");
        } else {
            combinedInText = inTexts.join("; ");
        }

        inTextCitation.innerHTML = escapeHtml(combinedInText);

        citationResult.hidden = false;

        citationResult.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        showMessage(
            `${sources.length} source${sources.length > 1 ? "s" : ""} formatted successfully.`,
            false
        );
    }

    /*
     * ---------------------------------------------------------
     * SINGLE GENERATE BUTTON
     * ---------------------------------------------------------
     */

    if (form) {
        form.addEventListener("submit", event => {
            event.preventDefault();

            const current = collectCurrentSource();
            const error = validateSource(current);

            if (error) {
                showMessage(error, true);
                return;
            }

            /*
             * If bibliography already has sources,
             * add the current source and generate all.
             */

            sources.push(current);
            renderSourceList();
            generateBibliography();

            resetSourceForm();
        });
    }

    /*
     * ---------------------------------------------------------
     * COPY
     * ---------------------------------------------------------
     */

    if (copyBtn) {
        copyBtn.addEventListener("click", async () => {
            const references = sources
                .map((source, index) => plain(formatSource(source, index + 1)))
                .join("\n\n");

            const inText = sources
                .map((source, index) =>
                    plain(getInTextCitation(source, index + 1))
                )
                .join(
                    sources[0]?.style === "ieee" ||
                    sources[0]?.style === "vancouver"
                        ? ", "
                        : "; "
                );

            const output =
                `References\n\n${references}\n\nIn-text citation\n${inText}`;

            try {
                await navigator.clipboard.writeText(output);

                const original = copyBtn.textContent;
                copyBtn.textContent = "Copied!";
                copyBtn.classList.add("copied");

                setTimeout(() => {
                    copyBtn.textContent = original;
                    copyBtn.classList.remove("copied");
                }, 1800);
            } catch {
                showMessage(
                    "Copy failed. Please select and copy the text manually.",
                    true
                );
            }
        });
    }

    /*
     * ---------------------------------------------------------
     * MESSAGES
     * ---------------------------------------------------------
     */

    function showMessage(message, error) {
        if (!formMessage) return;

        formMessage.textContent = message;
        formMessage.style.display = "block";

        if (error) {
            formMessage.classList.add("error");
        } else {
            formMessage.classList.remove("error");
        }
    }

    /*
     * ---------------------------------------------------------
     * STYLE CHANGE
     * ---------------------------------------------------------
     */

    if (citationStyle) {
        citationStyle.addEventListener("change", () => {
            if (sources.length > 0) {
                sources = sources.map(source => ({
                    ...source,
                    style: citationStyle.value
                }));

                renderSourceList();
                generateBibliography();
            }
        });
    }

    /*
     * ---------------------------------------------------------
     * REGION CHANGE
     * ---------------------------------------------------------
     */

    if (sourceRegion) {
        sourceRegion.addEventListener("change", () => {
            populateSourceTypes();
        });
    }

    /*
     * ---------------------------------------------------------
     * SOURCE TYPE CHANGE
     * ---------------------------------------------------------
     */

    if (sourceType) {
        sourceType.addEventListener("change", updateSourceFields);
    }

    /*
     * ---------------------------------------------------------
     * STARTUP
     * ---------------------------------------------------------
     */

    populateSourceTypes();

    const currentYear = document.getElementById("current-year");

    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }
});
```
