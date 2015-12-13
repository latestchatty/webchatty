declare module "striptags" {
    interface StripTags {
        (html: string): string;
        (html: string, allowableTags: string): string;
        (html: string, allowableTags: string[]): string;
    }
    const striptags: StripTags;
    export = striptags;
}
