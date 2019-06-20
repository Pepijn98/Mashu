export {}; // Idk why but this fixed the "Augmentations for the global scope can only be directly nested in external modules or ambient module declarations."
declare global {
    interface String {
        capitalize(): string;
    }

    interface Array<T> {
        paginate(pageSize: number, pageNumber: number): T[];
        remove(item: T): T[];
    }
}
