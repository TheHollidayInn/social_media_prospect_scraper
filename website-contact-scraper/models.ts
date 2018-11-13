export class InfoItemWithSource {
  urlSource: string;
  item: string;
  // @TODO: make enum
  type: number;

  constructor(urlSource: string, item: string, type: number) {
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

export class ItemWithSources {
  item: string;
  sources: string[];
  type: number;
  constructor(item: string, sources: string[], type: number) {
    this.item = item;
    this.sources = sources;
    this.type = type;
  }
}

export class EmailAndPhoneScrapeInfo {
  url: string;
  emails: any[];
  phoneNumbers: any[];
  constructor(url: string, emails: any[], phoneNumbers: any[]) {
    this.url = url;
    this.emails = emails;
    this.phoneNumbers = phoneNumbers;
  }
}

export class WebsiteHTMLResponse {
  url: string;
  html: string;
  constructor(url: string, html: string) {
    this.url = url;
    this.html = html;
  }
}

export class PageScrapeInfo {
  url: string;
  emailAndPhoneScrapeInfo: EmailAndPhoneScrapeInfo;
  foundURLS: any[];
  constructor(
    url: string,
    emailAndPhoneScrapeInfo: EmailAndPhoneScrapeInfo,
    foundURLS: any[]
  ) {
    this.url = url;
    this.emailAndPhoneScrapeInfo = emailAndPhoneScrapeInfo;
    this.foundURLS = foundURLS;
  }
}