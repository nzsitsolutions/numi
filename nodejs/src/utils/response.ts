export const single = <T>(data: T) => ({ data });

export const list = <T>(items: T[]) => ({
    data: {
        items,
        totalCount: items.length,
    },
});
