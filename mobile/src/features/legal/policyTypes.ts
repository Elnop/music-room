export type PolicySpan =
	string | { bold: string } | { code: string } | { link: string; url: string };

export type PolicyBlock = { paragraph: PolicySpan[] } | { list: PolicySpan[][] };

export type PolicySection = {
	title: string;
	blocks: PolicyBlock[];
};
