export const single = (data) => ({ data });
export const list = (items) => ({
    data: {
        items,
        totalCount: items.length,
    },
});
