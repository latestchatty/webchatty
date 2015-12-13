declare module "stemmer" {
    interface Stemmer {
        (str: string): string;
    }
    const stemmer: Stemmer;
    export = stemmer;
}
