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

const styleSelect = document.getElementById("citation-style");
const citationContext = document.querySelectorAll(
    'input[name="citation-context"]'
);
const sourceTypeSelect = document.getElementById("source-type");
const selectedContext = document.querySelector(
    'input[name="citation-context"]:checked'
)?.value || "international";

const authorInput = document.getElementById("author");
const yearInput = document.getElementById("year");
const titleInput = document.getElementById("title");
const publicationInput = document.getElementById("publication");
const urlInput = document.getElementById("url");
const doiInput = document.getElementById("doi");

const generateButton = document.getElementById("generate-btn");
const copyButton = document.getElementById("copy-btn");

const formMessage = document.getElementById("form-message");

const resultBox = document.getElementById("citation-result");
const citationText = document.getElementById("citation-text");
const inTextCitation = document.getElementById("in-text-citation");

const currentYear = document.getElementById("current-year");

/* =========================================================
   INITIAL SETUP
========================================================= */

if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
}

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
    const parts = clean(name).split(/\s+/).filter(Boolean);

    if (parts.length === 0) {
        return "";
    }

    return parts[parts.length - 1];
}

function getFirstName(name) {
    const parts = clean(name).split(/\s+/).filter(Boolean);

    if (parts.length <= 1) {
        return parts[0] || "";
    }

    return parts.slice(0, -1).join(" ");
}

function getInitials(name) {
    return clean(name)
        .split(/\s+/)
        .filter(Boolean)
        .map(part => part.charAt(0).toUpperCase() + ".")
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
    doi = clean(doi)
        .replace(/^https?:\/\/doi\.org\//i, "")
        .replace(/^doi:\s*/i, "");

    return doi;
}

function doiUrl(doi) {
    const normalized = normalizeDoi(doi);

    if (!normalized) {
        return "";
    }

    return "https://doi.org/" + normalized;
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

/* =========================================================
   AUTHOR FORMATTING
========================================================= */

function apaAuthor(author) {
    const lastName = getLastName(author);
    const firstName = getFirstName(author);

    if (!firstName) {
        return escapeHtml(lastName);
    }

    return `${escapeHtml(lastName)}, ${escapeHtml(getInitials(firstName))}`;
}

function mlaAuthor(author) {
    const lastName = getLastName(author);
    const firstName = getFirstName(author);

    if (!firstName) {
        return escapeHtml(lastName);
    }

    return `${escapeHtml(lastName)}, ${escapeHtml(firstName)}`;
}

function harvardAuthor(author) {
    const lastName = getLastName(author);
    const firstName = getFirstName(author);

    if (!firstName) {
        return escapeHtml(lastName);
    }

    return `${escapeHtml(lastName)}, ${escapeHtml(getInitials(firstName))}`;
}

function chicagoAuthor(author) {
    const lastName = getLastName(author);
    const firstName = getFirstName(author);

    if (!firstName) {
        return escapeHtml(lastName);
    }

    return `${escapeHtml(lastName)}, ${escapeHtml(firstName)}`;
}

function ieeeAuthor(author) {
    const lastName = getLastName(author);
    const firstName = getFirstName(author);

    if (!firstName) {
        return escapeHtml(lastName);
    }

    return `${escapeHtml(getInitials(firstName))} ${escapeHtml(lastName)}`;
}

function vancouverAuthor(author) {
    const lastName = getLastName(author);
    const firstName = getFirstName(author);

    if (!firstName) {
        return escapeHtml(lastName);
    }

    const initials = getInitials(firstName).replace(/\s+/g, "");

    return `${escapeHtml(lastName)} ${escapeHtml(initials)}`;
}

/* =========================================================
   IN-TEXT CITATIONS
========================================================= */

function makeInTextCitation(style, author, year) {
    const lastName = escapeHtml(getLastName(author));
    const safeYear = escapeHtml(year);

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
    const author = apaAuthor(data.author);
    const year = escapeHtml(data.year);

    if (data.type === "book") {
        let result = `${author} (${year}). ${italic(data.title)}`;

        if (data.publication) {
            result += `. ${escapeHtml(data.publication)}`;
        }

        result += ".";

        return result;
    }

    if (data.type === "journal") {
        let result = `${author} (${year}). ${displayTitle(data.title)}.`;

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

    let result = `${author} (${year}). ${displayTitle(data.title)}.`;

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
    const author = mlaAuthor(data.author);

    if (data.type === "book") {
        let result = `${author}. ${italic(data.title)}.`;

        if (data.publication) {
            result += ` ${escapeHtml(data.publication)},`;
        }

        if (data.year) {
            result += ` ${escapeHtml(data.year)}.`;
        }

        return result;
    }

    if (data.type === "journal") {
        let result = `${author}. ${quoteTitle(data.title)}`;

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

    let result = `${author}. ${quoteTitle(data.title)}`;

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
    const author = harvardAuthor(data.author);
    const year = escapeHtml(data.year);

    if (data.type === "book") {
        let result = `${author} (${year}) ${italic(data.title)}.`;

        if (data.publication) {
            result += ` ${escapeHtml(data.publication)}.`;
        }

        return result;
    }

    if (data.type === "journal") {
        let result = `${author} (${year}) '${escapeHtml(data.title)}'`;

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

    let result = `${author} (${year}) '${escapeHtml(data.title)}'.`;

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
    const author = chicagoAuthor(data.author);

    if (data.type === "book") {
        let result = `${author}. ${italic(data.title)}.`;

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
        let result = `${author}. ${quoteTitle(data.title)}.`;

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

    let result = `${author}. ${quoteTitle(data.title)}.`;

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
    const author = ieeeAuthor(data.author);

    if (data.type === "book") {
        let result = `${author}, ${italic(data.title)}`;

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
        let result = `${author}, ${quoteTitle(data.title)}`;

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

    let result = `${author}, ${quoteTitle(data.title)}`;

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
    const author = vancouverAuthor(data.author);

    if (data.type === "book") {
        let result = `${author}. ${escapeHtml(data.title)}.`;

        if (data.publication) {
            result += ` ${escapeHtml(data.publication)};`;
        }

        if (data.year) {
            result += ` ${escapeHtml(data.year)}.`;
        }

        return result;
    }

    if (data.type === "journal") {
        let result = `${author}. ${escapeHtml(data.title)}.`;

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

    let result = `${author}. ${escapeHtml(data.title)}.`;

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
    const author = clean(authorInput.value);
    const year = clean(yearInput.value);
    const title = clean(titleInput.value);

    if (!author) {
        return "Please enter the author / writer name.";
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
    generateButton.addEventListener("click", () => {
        formMessage.textContent = "";

        const error = validateForm();

        if (error) {
            resultBox.hidden = true;
            formMessage.textContent = error;
            return;
        }

        const data = {
            style: styleSelect.value,
            type: sourceTypeSelect.value,
            author: clean(authorInput.value),
            year: clean(yearInput.value),
            title: clean(titleInput.value),
            publication: clean(publicationInput.value),
            url: clean(urlInput.value),
            doi: clean(doiInput.value)
        };

        const citation = generateCitation(data);

        citationText.innerHTML = citation;

        inTextCitation.textContent = makeInTextCitation(
            data.style,
            data.author,
            data.year
        );

        resultBox.hidden = false;

        resultBox.scrollIntoView({
            behavior: "smooth",
            block: "nearest"
        });
    });
}

/* =========================================================
   COPY BUTTON
========================================================= */

if (copyButton) {
    copyButton.addEventListener("click", async () => {
        const plainText = citationText.innerText.trim();

        if (!plainText) {
            return;
        }

        try {
            await navigator.clipboard.writeText(plainText);

            copyButton.textContent = "Copied ✓";
            copyButton.classList.add("copied");

            setTimeout(() => {
                copyButton.textContent = "Copy Citation";
                copyButton.classList.remove("copied");
            }, 1800);

        } catch (error) {
            const temporaryTextArea = document.createElement("textarea");

            temporaryTextArea.value = plainText;
            temporaryTextArea.style.position = "fixed";
            temporaryTextArea.style.opacity = "0";

            document.body.appendChild(temporaryTextArea);

            temporaryTextArea.select();
            document.execCommand("copy");

            temporaryTextArea.remove();

            copyButton.textContent = "Copied ✓";
            copyButton.classList.add("copied");

            setTimeout(() => {
                copyButton.textContent = "Copy Citation";
                copyButton.classList.remove("copied");
            }, 1800);
        }
    });
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

    input.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();

            if (generateButton) {
                generateButton.click();
            }
        }
    });
});
