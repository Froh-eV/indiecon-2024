import db from "$lib/db";

export const GET = async ({ request, url }) => {
    try {
        const res = await db.collection('indieData')
            .find()
            .toArray()

        return new Response(JSON.stringify(res), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ message: error.message }), { status: 500 });
    }
};
