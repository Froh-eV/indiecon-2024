<script>
    import { onMount } from "svelte";
    import Poster from "@components/Poster.svelte";

    let data = [];
    let questions = [];

    async function fetchData() {
        const res = await fetch(`/api/getAll`);
        const json = await res.json();
        return json.reverse();
    }

    async function fetchQuestions() {
        const res = await fetch(`/api/question`);
        const json = await res.json();
        return json.reverse();
    }

    onMount(async () => {
        questions = await fetchQuestions();

        data = await fetchData();
        data = data
            .filter((d) => d.question == data[0].question)
            .reduce((acc, entry) => {
                const { question, answer } = entry;
                const lastCluster = acc[acc.length - 1];

                if (!lastCluster || lastCluster.question !== question) {
                    acc.push({ question, data: [{ answer }] });
                } else {
                    lastCluster.data.push({ answer });
                }

                return acc;
            }, []);
    });
</script>

<article>
    {#if data.length > 0}
        <!-- <p>Feel free to decide whether you want to print it or not:</p> -->
        <article class="container">
            {#each data as q, i}
                <Poster
                    {q}
                    {i}
                    {questions}
                    submitted={true}
                    staticPoster={true}
                />
            {/each}
        </article>
    {:else}
        <p>Loading...</p>
    {/if}
</article>

<style>
    article {
        padding: 10px;
        background-color: white;
    }

    .container {
        display: flex;
        flex-wrap: nowrap;
        overflow: auto;
        gap: 10px;
        /* margin-top: 40px; */
    }

    p {
        font-size: 12px;
    }
</style>
