export function mapToObject(map: Map<string, unknown>): { [key: string]: unknown } {
    const obj: { [key: string]: unknown } = {};
    for (const [key, value] of map) {
        obj[key] = value;
    }
    return obj;
}
