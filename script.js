/*
 * SinSigma Citation Generator
 * Client-side citation formatting engine
 *
 * No API
 * No database
 * No external service
 */

"use strict";


/* =========================================================
   ELEMENTS
========================================================= */

const styleSelect =
    document.getElementById("citation-style");

const citationContextInputs =
    document.querySelectorAll(
        'input[name="citation-context"]'
    );

const sourceTypeSelect =
    document.getElementById("source-type");

const authorInput =
    document.getElementById("author");

const yearInput =
    document.getElementById("year");

const titleInput =
    document.getElementById("title");

const publicationInput =
    document.getElementById("publication");

const urlInput =
    document.getElementById("url");

const doiInput =
    document.getElementById("doi");

const generateButton =
    document.getElementById("generate-btn");

const copyButton =
    document.getElementById("copy-btn");

const formMessage =
    document.getElementById("form-message");

const resultBox =
    document.getElementById("citation-result");

const citationText =
    document.getElementById("citation-text");

const inTextCitation =
    document.getElementById("in-text-citation");

const currentYear =
    document.getElementById("current-year");


/* =========================================================
   INITIAL SETUP
========================================================= */

if (currentYear) {
    currentYear.textContent =
        new Date().getFullYear();
}


/* =========================================================
   SOURCE TYPES
========================================================= */

const internationalSourceTypes = [
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


const indiaSourceTypes = [
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
        value: "judgment",
        label: "Court Judgment"
    },
    {
        value: "legislation",
        label: "Act / Legislation"
    },
    {
        value: "newspaper",
        label: "Newspaper Article"
    }
];


/* =========================================================
   DYNAMIC FIELD CONTAINER
========================================================= */

const dynamicFields =
    document.createElement("div");

dynamicFields.id =
    "dynamic-fields";

dynamicFields.className =
    "dynamic-fields";


if (doiInput && doiInput.closest(".form-group")) {

    doiInput
        .closest(".form-group")
        .insertAdjacentElement(
            "afterend",
            dynamicFields
        );
}


/* =========================================================
   CONTEXT
========================================================= */

function getSelectedContext() {

    const selected =
        document.querySelector(
            'input[name="citation-context"]:checked'
        );

    return selected
        ? selected.value
        : "international";
}


/* =========================================================
   SOURCE TYPE UPDATE
========================================================= */

function updateSourceTypes() {

    if (!sourceTypeSelect) {
        return;
    }

    const context =
        getSelectedContext();

    const sourceTypes =
        context === "india"
            ? indiaSourceTypes
            : internationalSourceTypes;

    const currentValue =
        sourceTypeSelect.value;

    sourceTypeSelect.innerHTML = "";

    sourceTypes.forEach(source => {

        const option =
            document.createElement("option");

        option.value =
            source.value;

        option.textContent =
            source.label;

        sourceTypeSelect.appendChild(
            option
        );
    });


    const valueStillExists =
        sourceTypes.some(
            source =>
                source.value === currentValue
        );


    if (valueStillExists) {
        sourceTypeSelect.value =
            currentValue;
    }


    updateSourceFields();
}


/* =========================================================
   FIELD CREATOR
========================================================= */

function createField(
    id,
    label,
    placeholder = "",
    type = "text",
    help = ""
) {

    const wrapper =
        document.createElement("div");

    wrapper.className =
        "dynamic-field";


    const labelElement =
        document.createElement("label");

    labelElement.htmlFor = id;

    labelElement.textContent =
        label;


    const input =
        document.createElement(
            type === "textarea"
                ? "textarea"
                : "input"
        );


    input.id = id;

    input.type =
        type === "textarea"
            ? undefined
            : type;

    input.placeholder =
        placeholder;


    if (type === "textarea") {

        input.rows = 3;

    }


    wrapper.appendChild(
        labelElement
    );

    wrapper.appendChild(
        input
    );


    if (help) {

        const helpText =
            document.createElement("div");

        helpText.className =
            "field-help";

        helpText.textContent =
            help;

        wrapper.appendChild(
            helpText
        );
    }


    return wrapper;
}


/* =========================================================
   SOURCE-SPECIFIC FIELDS
========================================================= */

function updateSourceFields() {

    if (!dynamicFields) {
        return;
    }


    dynamicFields.innerHTML = "";


    const context =
        getSelectedContext();

    const type =
        sourceTypeSelect
            ? sourceTypeSelect.value
            : "website";


    /*
     * International sources
     */

    if (context === "international") {

        if (type === "website") {

            dynamicFields.appendChild(
                createField(
                    "access-date",
                    "Access Date",
                    "e.g. 21 September 2026"
                )
            );
        }

        return;
    }


    /*
     * India — Government Report
     */

    if (type === "government-report") {

        dynamicFields.appendChild(
            createField(
                "organisation",
                "Ministry / Department / Organisation",
                "e.g. Ministry of Finance"
            )
        );

        dynamicFields.appendChild(
            createField(
                "report-number",
                "Report Number",
                "Optional"
            )
        );

        return;
    }


    /*
     * India — Court Judgment
     */

    if (type === "judgment") {

        dynamicFields.appendChild(
            createField(
                "court",
                "Court",
                "e.g. Supreme Court of India"
            )
        );

        dynamicFields.appendChild(
            createField(
                "case-number",
                "Case / Appeal Number",
                "e.g. Civil Appeal No. 1234 of 2026"
            )
        );

        dynamicFields.appendChild(
            createField(
                "judgment-date",
                "Judgment Date",
                "e.g. 21 September 2026"
            )
        );

        dynamicFields.appendChild(
            createField(
                "reporter",
                "Reporter / Citation",
                "Optional"
            )
        );

        return;
    }


    /*
     * India — Act / Legislation
     */

    if (type === "legislation") {

        dynamicFields.appendChild(
            createField(
                "act-number",
                "Act Number",
                "e.g. Act No. 18 of 2026"
            )
        );

        dynamicFields.appendChild(
            createField(
                "authority",
                "Issuing Authority",
                "e.g. Government of India"
            )
        );

        return;
    }


    /*
     * India — Newspaper
     */

    if (type === "newspaper") {

        dynamicFields.appendChild(
            createField(
                "edition",
                "Edition / City",
                "e.g. Mumbai"
            )
        );

        dynamicFields.appendChild(
            createField(
                "publication-date",
                "Publication Date",
                "e.g. 21 September 2026"
            )
        );

        return;
    }
}


/* =========================================================
   CONTEXT LISTENERS
========================================================= */

citationContextInputs.forEach(input => {

    input.addEventListener(
        "change",
        () => {

            updateSourceTypes();

            if (resultBox) {
                resultBox.hidden = true;
            }

            if (formMessage) {
                formMessage.textContent = "";
            }

        }
    );

});


/* =========================================================
   SOURCE TYPE LISTENER
========================================================= */

if (sourceTypeSelect) {

    sourceTypeSelect.addEventListener(
        "change",
        () => {

            updateSourceFields();

            if (resultBox) {
                resultBox.hidden = true;
            }

        }
    );
}


/* Initial setup */

updateSourceTypes();


/* =========================================================
   HELPERS
========================================================= */

function clean(value) {

    return String(value || "")
        .trim()
        .replace(/\s+/g, " ");
}


function escapeHtml(value) {

    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function getLastName(name) {

    const parts =
        clean(name)
            .split(/\s+/)
            .filter(Boolean);

    if (parts.length === 0) {
        return "";
    }

    return parts[parts.length - 1];
}


function getFirstName(name) {

    const parts =
        clean(name)
            .split(/\s+/)
            .filter(Boolean);

    if (parts.length <= 1) {
        return parts[0] || "";
    }

    return parts
        .slice(0, -1)
        .join(" ");
}


function getInitials(name) {

    return clean(name)
        .split(/\s+/)
        .filter(Boolean)
        .map(
            part =>
                part.charAt(0).toUpperCase() + "."
        )
        .join(" ");
}


function normalizeUrl(url) {

    url = clean(url);

    if (!url) {
        return "";
    }

    if (!/^https?:\/\//i.test(url)) {
        return "https://" + url;
    }

    return url;
}


function normalizeDoi(doi) {

    return clean(doi)
        .replace(
            /^https?:\/\/doi\.org\//i,
            ""
        )
        .replace(
            /^doi:\s*/i,
            ""
        );
}


function doiUrl(doi) {

    const normalized =
        normalizeDoi(doi);

    if (!normalized) {
        return "";
    }

    return "https://doi.org/" +
        normalized;
}


function italic(text) {

    return `<em>${escapeHtml(text)}</em>`;
}


function quoteTitle(text) {

    return `"${escapeHtml(text)}"`;
}


function displayTitle(text) {

    return escapeHtml(text);
}


function getDynamicValue(id) {

    const element =
        document.getElementById(id);

    return element
        ? clean(element.value)
        : "";
}


/* =========================================================
   AUTHOR FORMATTING
========================================================= */

function apaAuthor(author) {

    const lastName =
        getLastName(author);

    const firstName =
        getFirstName(author);

    if (!firstName) {
        return escapeHtml(lastName);
    }

    return `${escapeHtml(lastName)}, ${escapeHtml(getInitials(firstName))}`;
}


function mlaAuthor(author) {

    const lastName =
        getLastName(author);

    const firstName =
        getFirstName(author);

    if (!firstName) {
        return escapeHtml(lastName);
    }

    return `${escapeHtml(lastName)}, ${escapeHtml(firstName)}`;
}


function harvardAuthor(author) {

    const lastName =
        getLastName(author);

    const firstName =
        getFirstName(author);

    if (!firstName) {
        return escapeHtml(lastName);
    }

    return `${escapeHtml(lastName)}, ${escapeHtml(getInitials(firstName))}`;
}


function chicagoAuthor(author) {

    const lastName =
        getLastName(author);

    const firstName =
        getFirstName(author);

    if (!firstName) {
        return escapeHtml(lastName);
    }

    return `${escapeHtml(lastName)}, ${escapeHtml(firstName)}`;
}


function ieeeAuthor(author) {

    const lastName =
        getLastName(author);

    const firstName =
        getFirstName(author);

    if (!firstName) {
        return escapeHtml(lastName);
    }

    return `${escapeHtml(getInitials(firstName))} ${escapeHtml(lastName)}`;
}


function vancouverAuthor(author) {

    const lastName =
        getLastName(author);

    const firstName =
        getFirstName(author);

    if (!firstName) {
        return escapeHtml(lastName);
    }

    const initials =
        getInitials(firstName)
            .replace(/\s+/g, "");

    return `${escapeHtml(lastName)} ${escapeHtml(initials)}`;
}


/* =========================================================
   IN-TEXT CITATIONS
========================================================= */

function makeInTextCitation(
    style,
    author,
    year
) {

    const lastName =
        escapeHtml(
            getLastName(author)
        );

    const safeYear =
        escapeHtml(year);


    switch (style) {

        case "mla":
            return `(${lastName})`;

        case "chicago":
            return `(${lastName} ${safeYear})`;

        case "ieee":
            return `[1]`;

        case "vancouver":
            return `(1)`;

        case "harvard":
            return `(${lastName}, ${safeYear})`;

        case "apa":
        default:
            return `(${lastName}, ${safeYear})`;
    }
}


/* =========================================================
   APA 7
========================================================= */

function formatAPA(data) {

    const author =
        apaAuthor(data.author);

    const year =
        escapeHtml(data.year);


    if (data.type === "legislation") {

        let result =
            `${italic(data.title)} (${year}).`;

        if (data.actNumber) {
            result += ` ${escapeHtml(data.actNumber)}.`;
        }

        if (data.authority) {
            result += ` ${escapeHtml(data.authority)}.`;
        }

        if (data.url) {
            result += ` ${escapeHtml(normalizeUrl(data.url))}`;
        }

        return result;
    }


    if (data.type === "book") {

        let result =
            `${author} (${year}). ${italic(data.title)}`;

        if (data.publication) {
            result += `. ${escapeHtml(data.publication)}`;
        }

        result += ".";

        return result;
    }


    if (data.type === "journal") {

        let result =
            `${author} (${year}). ${displayTitle(data.title)}.`;

        if (data.publication) {
            result += ` ${italic(data.publication)}.`;
        }

        if (data.doi) {
            result += ` ${escapeHtml(doiUrl(data.doi))}`;
        } else if (data.url) {
            result += ` ${escapeHtml(normalizeUrl(data.url))}`;
        }

        return result;
    }


    if (data.type === "government-report") {

        let result =
            `${author} (${year}). ${italic(data.title)}.`;

        if (data.organisation) {
            result += ` ${escapeHtml(data.organisation)}.`;
        } else if (data.publication) {
            result += ` ${escapeHtml(data.publication)}.`;
        }

        if (data.reportNumber) {
            result += ` (${escapeHtml(data.reportNumber)}).`;
        }

        if (data.url) {
            result += ` ${escapeHtml(normalizeUrl(data.url))}`;
        }

        return result;
    }


    if (data.type === "judgment") {

        let result =
            `${author} (${year}). ${italic(data.title)}.`;

        if (data.court) {
            result += ` ${escapeHtml(data.court)}.`;
        }

        if (data.caseNumber) {
            result += ` ${escapeHtml(data.caseNumber)}.`;
        }

        if (data.judgmentDate) {
            result += ` ${escapeHtml(data.judgmentDate)}.`;
        }

        if (data.reporter) {
            result += ` ${escapeHtml(data.reporter)}.`;
        }

        if (data.url) {
            result += ` ${escapeHtml(normalizeUrl(data.url))}`;
        }

        return result;
    }


    if (data.type === "newspaper") {

        let result =
            `${author} (${year}). ${displayTitle(data.title)}.`;

        if (data.publication) {
            result += ` ${italic(data.publication)}.`;
        }

        if (data.edition) {
            result += ` ${escapeHtml(data.edition)} edition.`;
        }

        if (data.publicationDate) {
            result += ` ${escapeHtml(data.publicationDate)}.`;
        }

        if (data.url) {
            result += ` ${escapeHtml(normalizeUrl(data.url))}`;
        }

        return result;
    }


    let result =
        `${author} (${year}). ${displayTitle(data.title)}.`;

    if (data.publication) {
        result += ` ${escapeHtml(data.publication)}.`;
    }

    if (data.doi) {
        result += ` ${escapeHtml(doiUrl(data.doi))}`;
    } else if (data.url) {
        result += ` ${escapeHtml(normalizeUrl(data.url))}`;
    }

    return result;
}


/* =========================================================
   MLA 9
========================================================= */

function formatMLA(data) {

    const author =
        mlaAuthor(data.author);


    if (data.type === "legislation") {

        let result =
            `${italic(data.title)}.`;

        if (data.actNumber) {
            result += ` ${escapeHtml(data.actNumber)}.`;
        }

        if (data.authority) {
            result += ` ${escapeHtml(data.authority)}.`;
        }

        if (data.year) {
            result += ` ${escapeHtml(data.year)}.`;
        }

        if (data.url) {
            result += ` ${escapeHtml(normalizeUrl(data.url))}.`;
        }

        return result;
    }


    if (data.type === "book") {

        let result =
            `${author}. ${italic(data.title)}.`;

        if (data.publication) {
            result += ` ${escapeHtml(data.publication)},`;
        }

        if (data.year) {
            result += ` ${escapeHtml(data.year)}.`;
        }

        return result;
    }


    if (data.type === "journal") {

        let result =
            `${author}. ${quoteTitle(data.title)}`;

        if (data.publication) {
            result += ` ${italic(data.publication)},`;
        }

        if (data.year) {
            result += ` ${escapeHtml(data.year)}.`;
        }

        if (data.doi) {
            result += ` ${escapeHtml(doiUrl(data.doi))}.`;
        } else if (data.url) {
            result += ` ${escapeHtml(normalizeUrl(data.url))}.`;
        }

        return result;
    }


    if (data.type === "government-report") {

        let result =
            `${author}. ${italic(data.title)}.`;

        if (data.organisation) {
            result += ` ${escapeHtml(data.organisation)}.`;
        }

        if (data.year) {
            result += ` ${escapeHtml(data.year)}.`;
        }

        if (data.url) {
            result += ` ${escapeHtml(normalizeUrl(data.url))}.`;
        }

        return result;
    }


    if (data.type === "judgment") {

        let result =
            `${author}. ${italic(data.title)}.`;

        if (data.court) {
            result += ` ${escapeHtml(data.court)}.`;
        }

        if (data.caseNumber) {
            result += ` ${escapeHtml(data.caseNumber)}.`;
        }

        if (data.year) {
            result += ` ${escapeHtml(data.year)}.`;
        }

        if (data.url) {
            result += ` ${escapeHtml(normalizeUrl(data.url))}.`;
        }

        return result;
    }


    if (data.type === "newspaper") {

        let result =
            `${author}. ${quoteTitle(data.title)}`;

        if (data.publication) {
            result += `. ${italic(data.publication)}`;
        }

        if (data.edition) {
            result += `, ${escapeHtml(data.edition)}`;
        }

        if (data.year) {
            result += `, ${escapeHtml(data.year)}`;
        }

        result += ".";

        if (data.url) {
            result += ` ${escapeHtml(normalizeUrl(data.url))}.`;
        }

        return result;
    }


    let result =
        `${author}. ${quoteTitle(data.title)}`;

    if (data.publication) {
        result += `. ${italic(data.publication)}`;
    }

    if (data.year) {
        result += `, ${escapeHtml(data.year)}`;
    }

    result += ".";

    if (data.url) {
        result += ` ${escapeHtml(normalizeUrl(data.url))}.`;
    }

    return result;
}


/* =========================================================
   HARVARD
========================================================= */

function formatHarvard(data) {

    const author =
        harvardAuthor(data.author);

    const year =
        escapeHtml(data.year);


    if (data.type === "legislation") {

        let result =
            `${italic(data.title)} (${year}).`;

        if (data.actNumber) {
            result += ` ${escapeHtml(data.actNumber)}.`;
        }

        if (data.authority) {
            result += ` ${escapeHtml(data.authority)}.`;
        }

        if (data.url) {
            result += ` Available at: ${escapeHtml(normalizeUrl(data.url))}.`;
        }

        return result;
    }


    if (data.type === "book") {

        let result =
            `${author} (${year}) ${italic(data.title)}.`;

        if (data.publication) {
            result += ` ${escapeHtml(data.publication)}.`;
        }

        return result;
    }


    if (data.type === "journal") {

        let result =
            `${author} (${year}) '${escapeHtml(data.title)}'`;

        if (data.publication) {
            result += `, ${italic(data.publication)}`;
        }

        result += ".";

        if (data.doi) {
            result += ` ${escapeHtml(doiUrl(data.doi))}`;
        } else if (data.url) {
            result += ` ${escapeHtml(normalizeUrl(data.url))}`;
        }

        return result;
    }


    if (data.type === "government-report") {

        let result =
            `${author} (${year}) ${italic(data.title)}.`;

        if (data.organisation) {
            result += ` ${escapeHtml(data.organisation)}.`;
        }

        if (data.url) {
            result += ` Available at: ${escapeHtml(normalizeUrl(data.url))}.`;
        }

        return result;
    }


    if (data.type === "judgment") {

        let result =
            `${author} (${year}) ${italic(data.title)}.`;

        if (data.court) {
            result += ` ${escapeHtml(data.court)}.`;
        }

        if (data.caseNumber) {
            result += ` ${escapeHtml(data.caseNumber)}.`;
        }

        if (data.reporter) {
            result += ` ${escapeHtml(data.reporter)}.`;
        }

        if (data.url) {
            result += ` Available at: ${escapeHtml(normalizeUrl(data.url))}.`;
        }

        return result;
    }


    if (data.type === "newspaper") {

        let result =
            `${author} (${year}) '${escapeHtml(data.title)}'.`;

        if (data.publication) {
            result += ` ${escapeHtml(data.publication)}.`;
        }

        if (data.edition) {
            result += ` ${escapeHtml(data.edition)} edition.`;
        }

        if (data.url) {
            result += ` Available at: ${escapeHtml(normalizeUrl(data.url))}.`;
        }

        return result;
    }


    let result =
        `${author} (${year}) '${escapeHtml(data.title)}'.`;

    if (data.publication) {
        result += ` ${escapeHtml(data.publication)}.`;
    }

    if (data.url) {
        result += ` Available at: ${escapeHtml(normalizeUrl(data.url))}.`;
    }

    return result;
}


/* =========================================================
   CHICAGO
========================================================= */

function formatChicago(data) {

    const author =
        chicagoAuthor(data.author);


    if (data.type === "legislation") {

        let result =
            `${italic(data.title)}.`;

        if (data.actNumber) {
            result += ` ${escapeHtml(data.actNumber)}`;
        }

        if (data.authority) {
            result += ` ${escapeHtml(data.authority)}`;
        }

        if (data.year) {
            result += `, ${escapeHtml(data.year)}.`;
        } else {
            result += ".";
        }

        if (data.url) {
            result += ` ${escapeHtml(normalizeUrl(data.url))}`;
        }

        return result;
    }


    if (data.type === "book") {

        let result =
            `${author}. ${italic(data.title)}.`;

        if (data.publication) {
            result += ` ${escapeHtml(data.publication)}`;
        }

        if (data.year) {
            result += `, ${escapeHtml(data.year)}.`;
        } else {
            result += ".";
        }

        return result;
    }


    if (data.type === "journal") {

        let result =
            `${author}. ${quoteTitle(data.title)}.`;

        if (data.publication) {
            result += ` ${italic(data.publication)}`;
        }

        if (data.year) {
            result += ` (${escapeHtml(data.year)}).`;
        }

        if (data.doi) {
            result += ` ${escapeHtml(doiUrl(data.doi))}`;
        } else if (data.url) {
            result += ` ${escapeHtml(normalizeUrl(data.url))}`;
        }

        return result;
    }


    if (data.type === "government-report") {

        let result =
            `${author}. ${italic(data.title)}.`;

        if (data.organisation) {
            result += ` ${escapeHtml(data.organisation)}.`;
        }

        if (data.year) {
            result += ` ${escapeHtml(data.year)}.`;
        }

        if (data.url) {
            result += ` ${escapeHtml(normalizeUrl(data.url))}`;
        }

        return result;
    }


    if (data.type === "judgment") {

        let result =
            `${author}. ${italic(data.title)}.`;

        if (data.court) {
            result += ` ${escapeHtml(data.court)}.`;
        }

        if (data.caseNumber) {
            result += ` ${escapeHtml(data.caseNumber)}.`;
        }

        if (data.year) {
            result += ` ${escapeHtml(data.year)}.`;
        }

        if (data.reporter) {
            result += ` ${escapeHtml(data.reporter)}.`;
        }

        if (data.url) {
            result += ` ${escapeHtml(normalizeUrl(data.url))}`;
        }

        return result;
    }


    if (data.type === "newspaper") {

        let result =
            `${author}. ${quoteTitle(data.title)}.`;

        if (data.publication) {
            result += ` ${escapeHtml(data.publication)}`;
        }

        if (data.edition) {
            result += `, ${escapeHtml(data.edition)}`;
        }

        if (data.year) {
            result += `, ${escapeHtml(data.year)}`;
        }

        result += ".";

        if (data.url) {
            result += ` ${escapeHtml(normalizeUrl(data.url))}`;
        }

        return result;
    }


    let result =
        `${author}. ${quoteTitle(data.title)}.`;

    if (data.publication) {
        result += ` ${escapeHtml(data.publication)}.`;
    }

    if (data.year) {
        result += ` ${escapeHtml(data.year)}.`;
    }

    if (data.url) {
        result += ` ${escapeHtml(normalizeUrl(data.url))}`;
    }

    return result;
}


/* =========================================================
   IEEE
========================================================= */

function formatIEEE(data) {

    const author =
        ieeeAuthor(data.author);


    if (data.type === "legislation") {

        let result =
            `${quoteTitle(data.title)}`;

        if (data.actNumber) {
            result += ` ${escapeHtml(data.actNumber)}`;
        }

        if (data.authority) {
            result += ` ${escapeHtml(data.authority)}`;
        }

        if (data.year) {
            result += `, ${escapeHtml(data.year)}`;
        }

        result += ".";

        if (data.url) {
            result += ` [Online]. Available: ${escapeHtml(normalizeUrl(data.url))}`;
        }

        return result;
    }


    if (data.type === "book") {

        let result =
            `${author}, ${italic(data.title)}`;

        if (data.publication) {
            result += `, ${escapeHtml(data.publication)}`;
        }

        if (data.year) {
            result += `, ${escapeHtml(data.year)}.`;
        } else {
            result += ".";
        }

        return result;
    }


    if (data.type === "journal") {

        let result =
            `${author}, ${quoteTitle(data.title)}`;

        if (data.publication) {
            result += ` ${italic(data.publication)}`;
        }

        if (data.year) {
            result += `, ${escapeHtml(data.year)}`;
        }

        result += ".";

        if (data.doi) {
            result += ` doi: ${escapeHtml(normalizeDoi(data.doi))}.`;
        } else if (data.url) {
            result += ` [Online]. Available: ${escapeHtml(normalizeUrl(data.url))}`;
        }

        return result;
    }


    if (
        data.type === "government-report" ||
        data.type === "judgment" ||
        data.type === "newspaper"
    ) {

        let result =
            `${author}, ${quoteTitle(data.title)}`;

        if (data.publication) {
            result += ` ${escapeHtml(data.publication)}`;
        }

        if (data.year) {
            result += `, ${escapeHtml(data.year)}`;
        }

        result += ".";

        if (data.url) {
            result += ` [Online]. Available: ${escapeHtml(normalizeUrl(data.url))}`;
        }

        return result;
    }


    let result =
        `${author}, ${quoteTitle(data.title)}`;

    if (data.publication) {
        result += ` ${escapeHtml(data.publication)}`;
    }

    if (data.year) {
        result += `, ${escapeHtml(data.year)}`;
    }

    result += ".";

    if (data.url) {
        result += ` [Online]. Available: ${escapeHtml(normalizeUrl(data.url))}`;
    }

    return result;
}


/* =========================================================
   VANCOUVER
========================================================= */

function formatVancouver(data) {

    const author =
        vancouverAuthor(data.author);


    if (data.type === "legislation") {

        let result =
            `${escapeHtml(data.title)}.`;

        if (data.actNumber) {
            result += ` ${escapeHtml(data.actNumber)}.`;
        }

        if (data.authority) {
            result += ` ${escapeHtml(data.authority)}.`;
        }

        if (data.year) {
            result += ` ${escapeHtml(data.year)}.`;
        }

        if (data.url) {
            result += ` Available from: ${escapeHtml(normalizeUrl(data.url))}`;
        }

        return result;
    }


    if (data.type === "book") {

        let result =
            `${author}. ${escapeHtml(data.title)}.`;

        if (data.publication) {
            result += ` ${escapeHtml(data.publication)};`;
        }

        if (data.year) {
            result += ` ${escapeHtml(data.year)}.`;
        }

        return result;
    }


    if (data.type === "journal") {

        let result =
            `${author}. ${escapeHtml(data.title)}.`;

        if (data.publication) {
            result += ` ${escapeHtml(data.publication)}.`;
        }

        if (data.year) {
            result += ` ${escapeHtml(data.year)}.`;
        }

        if (data.doi) {
            result += ` doi:${escapeHtml(normalizeDoi(data.doi))}`;
        } else if (data.url) {
            result += ` Available from: ${escapeHtml(normalizeUrl(data.url))}`;
        }

        return result;
    }


    let result =
        `${author}. ${escapeHtml(data.title)}.`;

    if (data.publication) {
        result += ` ${escapeHtml(data.publication)}.`;
    }

    if (data.year) {
        result += ` ${escapeHtml(data.year)}.`;
    }

    if (data.url) {
        result += ` Available from: ${escapeHtml(normalizeUrl(data.url))}`;
    }

    return result;
}


/* =========================================================
   MAIN FORMATTER
========================================================= */

function generateCitation(data) {

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
   VALIDATION
========================================================= */

function validateForm() {

    const context =
        getSelectedContext();

    const type =
        sourceTypeSelect.value;

    const author =
        clean(authorInput.value);

    const year =
        clean(yearInput.value);

    const title =
        clean(titleInput.value);


    /*
     * Legislation does not require author.
     */

    if (
        !(context === "india" &&
          type === "legislation")
    ) {

        if (!author) {
            return "Please enter the author / writer name.";
        }
    }


    if (!year) {
        return "Please enter the publication year.";
    }


    if (!/^\d{4}$/.test(year)) {
        return "Please enter a valid 4-digit year.";
    }


    if (!title) {
        return "Please enter the source title.";
    }


    return "";
}


/* =========================================================
   GENERATE BUTTON
========================================================= */

if (generateButton) {

    generateButton.addEventListener(
        "click",
        () => {

            formMessage.textContent = "";


            const error =
                validateForm();


            if (error) {

                resultBox.hidden = true;

                formMessage.textContent =
                    error;

                return;
            }


            const selectedContext =
                getSelectedContext();


            const data = {

                context:
                    selectedContext,

                style:
                    styleSelect.value,

                type:
                    sourceTypeSelect.value,

                author:
                    clean(authorInput.value),

                year:
                    clean(yearInput.value),

                title:
                    clean(titleInput.value),

                publication:
                    clean(publicationInput.value),

                url:
                    clean(urlInput.value),

                doi:
                    clean(doiInput.value),


                /* India-specific fields */

                organisation:
                    getDynamicValue(
                        "organisation"
                    ),

                reportNumber:
                    getDynamicValue(
                        "report-number"
                    ),

                court:
                    getDynamicValue(
                        "court"
                    ),

                caseNumber:
                    getDynamicValue(
                        "case-number"
                    ),

                judgmentDate:
                    getDynamicValue(
                        "judgment-date"
                    ),

                reporter:
                    getDynamicValue(
                        "reporter"
                    ),

                actNumber:
                    getDynamicValue(
                        "act-number"
                    ),

                authority:
                    getDynamicValue(
                        "authority"
                    ),

                edition:
                    getDynamicValue(
                        "edition"
                    ),

                publicationDate:
                    getDynamicValue(
                        "publication-date"
                    ),

                accessDate:
                    getDynamicValue(
                        "access-date"
                    )
            };


            const citation =
                generateCitation(data);


            citationText.innerHTML =
                citation;


            inTextCitation.textContent =
                makeInTextCitation(
                    data.style,
                    data.author,
                    data.year
                );


            resultBox.hidden = false;


            resultBox.scrollIntoView({
                behavior: "smooth",
                block: "nearest"
            });

        }
    );
}


/* =========================================================
   COPY BUTTON
========================================================= */

if (copyButton) {

    copyButton.addEventListener(
        "click",
        async () => {

            const plainText =
                citationText.innerText.trim();


            if (!plainText) {
                return;
            }


            try {

                await navigator.clipboard
                    .writeText(plainText);


                copyButton.textContent =
                    "Copied ✓";


                copyButton.classList.add(
                    "copied"
                );


                setTimeout(() => {

                    copyButton.textContent =
                        "Copy Citation";

                    copyButton.classList.remove(
                        "copied"
                    );

                }, 1800);


            } catch (error) {

                const temporaryTextArea =
                    document.createElement(
                        "textarea"
                    );


                temporaryTextArea.value =
                    plainText;

                temporaryTextArea.style.position =
                    "fixed";

                temporaryTextArea.style.opacity =
                    "0";


                document.body.appendChild(
                    temporaryTextArea
                );


                temporaryTextArea.select();

                document.execCommand("copy");

                temporaryTextArea.remove();


                copyButton.textContent =
                    "Copied ✓";

                copyButton.classList.add(
                    "copied"
                );


                setTimeout(() => {

                    copyButton.textContent =
                        "Copy Citation";

                    copyButton.classList.remove(
                        "copied"
                    );

                }, 1800);

            }

        }
    );
}


/* =========================================================
   ENTER KEY SUPPORT
========================================================= */

[
    authorInput,
    yearInput,
    titleInput,
    publicationInput,
    urlInput,
    doiInput

].forEach(input => {

    if (!input) {
        return;
    }


    input.addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {

                event.preventDefault();


                if (generateButton) {
                    generateButton.click();
                }

            }

        }
    );

});
