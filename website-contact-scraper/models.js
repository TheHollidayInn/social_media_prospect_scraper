"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class InfoItemWithSource {
    constructor(urlSource, item, type) {
        this.urlSource = urlSource;
        this.item = item;
        this.type = type;
    }
    isEmail() {
        return this.type == -0;
    }
    isPhone() {
        return this.type === 1;
    }
}
exports.InfoItemWithSource = InfoItemWithSource;
class ItemWithSources {
    constructor(item, sources, type) {
        this.item = item;
        this.sources = sources;
        this.type = type;
    }
}
exports.ItemWithSources = ItemWithSources;
class EmailAndPhoneScrapeInfo {
    constructor(url, emails, phoneNumbers) {
        this.url = url;
        this.emails = emails;
        this.phoneNumbers = phoneNumbers;
    }
}
exports.EmailAndPhoneScrapeInfo = EmailAndPhoneScrapeInfo;
class WebsiteHTMLResponse {
    constructor(url, html) {
        this.url = url;
        this.html = html;
    }
}
exports.WebsiteHTMLResponse = WebsiteHTMLResponse;
class PageScrapeInfo {
    constructor(url, emailAndPhoneScrapeInfo, foundURLS) {
        this.url = url;
        this.emailAndPhoneScrapeInfo = emailAndPhoneScrapeInfo;
        this.foundURLS = foundURLS;
    }
}
exports.PageScrapeInfo = PageScrapeInfo;
